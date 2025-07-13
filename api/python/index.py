import os
import json
from datetime import datetime, timezone
from typing import Dict, List, Optional, Any
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import google.generativeai as genai
from supabase import create_client, Client

# Initialize FastAPI app
app = FastAPI(title="ADHD Task Tracker API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://*.vercel.app"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Global variables
supabase_client: Optional[Client] = None
genai_model = None

# Initialize services
def initialize_services():
    global supabase_client, genai_model
    
    # Initialize Supabase
    try:
        supabase_url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
        supabase_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
        if supabase_url and supabase_key:
            supabase_client = create_client(supabase_url, supabase_key)
            print("✅ Supabase client initialized")
        else:
            print("⚠️ Supabase credentials not found")
    except Exception as e:
        print(f"⚠️ Supabase initialization failed: {e}")
    
    # Initialize Gemini AI
    try:
        api_key = os.environ.get("GEMINI_API_KEY")
        if api_key:
            genai.configure(api_key=api_key)
            genai_model = genai.GenerativeModel("gemini-2.0-flash")
            print("✅ Gemini AI initialized")
        else:
            print("⚠️ Gemini API key not found")
    except Exception as e:
        print(f"⚠️ Gemini AI initialization failed: {e}")

# Initialize on startup
@app.on_event("startup")
async def startup_event():
    initialize_services()

# Pydantic models
class PrepStep(BaseModel):
    title: str
    offset_minutes: int
    completed: bool = False

class CreateTaskRequest(BaseModel):
    title: str
    description: Optional[str] = ""
    due_date: Optional[str] = None
    category: str = "general"
    user_id: str

class UpdateTaskRequest(BaseModel):
    id: str
    status: Optional[str] = None
    prep_steps: Optional[List[PrepStep]] = None

class TaskResponse(BaseModel):
    id: str
    user_id: str
    title: str
    description: Optional[str]
    due_date: str
    category: str
    status: str
    prep_steps: List[PrepStep]
    created_at: str
    updated_at: Optional[str]

# Helper functions
def generate_prep_steps(title: str, due_date: str, category: str) -> List[PrepStep]:
    """Generate AI-powered preparation steps using Gemini"""
    if not genai_model:
        # Fallback to smart defaults
        return [
            PrepStep(title="Gather materials needed", offset_minutes=-60, completed=False),
            PrepStep(title="Set up workspace", offset_minutes=-30, completed=False),
            PrepStep(title="Final review and preparation", offset_minutes=-15, completed=False)
        ]
    
    try:
        prompt = f"""You are an ADHD productivity coach. For this task:
        Title: {title}
        Due: {due_date}
        Category: {category}
        
        Generate 2-3 preparation steps to help someone with ADHD complete this task successfully.
        Consider common ADHD challenges like time blindness, executive dysfunction, and task initiation.
        
        Return ONLY a JSON array with this exact format:
        [
          {{"title": "Step description", "offset_minutes": -60}},
          {{"title": "Step description", "offset_minutes": -30}},
          {{"title": "Step description", "offset_minutes": -15}}
        ]
        
        Use negative offset_minutes (time before due date). Keep titles concise and actionable."""
        
        response = genai_model.generate_content(prompt)
        response_text = response.text.strip()
        
        # Parse JSON response
        if response_text.startswith('[') and response_text.endswith(']'):
            steps_data = json.loads(response_text)
            return [PrepStep(**step, completed=False) for step in steps_data]
        else:
            raise ValueError("Invalid response format")
            
    except Exception as e:
        print(f"AI generation failed: {e}")
        # Fallback to smart defaults
        return [
            PrepStep(title="Gather materials and resources", offset_minutes=-60, completed=False),
            PrepStep(title="Set up workspace and environment", offset_minutes=-30, completed=False),
            PrepStep(title="Final check and mental preparation", offset_minutes=-15, completed=False)
        ]

# API Endpoints
@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now(timezone.utc).isoformat()}

@app.post("/tasks", response_model=TaskResponse)
async def create_task(task_request: CreateTaskRequest):
    if not supabase_client:
        raise HTTPException(status_code=500, detail="Database not available")
    
    try:
        # Set default due date if not provided
        if not task_request.due_date:
            tomorrow = datetime.now(timezone.utc).replace(hour=9, minute=0, second=0, microsecond=0)
            tomorrow = tomorrow.replace(day=tomorrow.day + 1)
            task_request.due_date = tomorrow.isoformat()
        
        # Generate AI prep steps
        prep_steps = generate_prep_steps(
            task_request.title, 
            task_request.due_date, 
            task_request.category
        )
        
        # Insert task into database
        task_data = {
            "user_id": task_request.user_id,
            "title": task_request.title,
            "description": task_request.description,
            "due_date": task_request.due_date,
            "category": task_request.category,
            "status": "pending"
        }
        
        task_result = supabase_client.table("tasks").insert(task_data).execute()
        if not task_result.data:
            raise HTTPException(status_code=500, detail="Failed to create task")
        
        task = task_result.data[0]
        
        # Insert prep steps
        prep_steps_data = [
            {
                "task_id": task["id"],
                "title": step.title,
                "offset_minutes": step.offset_minutes,
                "completed": step.completed
            }
            for step in prep_steps
        ]
        
        prep_result = supabase_client.table("prep_steps").insert(prep_steps_data).execute()
        
        # Return complete task with prep steps
        return TaskResponse(
            id=task["id"],
            user_id=task["user_id"],
            title=task["title"],
            description=task["description"],
            due_date=task["due_date"],
            category=task["category"],
            status=task["status"],
            prep_steps=prep_steps,
            created_at=task["created_at"],
            updated_at=task.get("updated_at")
        )
        
    except Exception as e:
        print(f"Error creating task: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/tasks/{user_id}")
async def get_tasks(user_id: str):
    if not supabase_client:
        raise HTTPException(status_code=500, detail="Database not available")
    
    try:
        # Get tasks with prep steps
        tasks_result = supabase_client.table("tasks").select(
            "*, prep_steps(*)"
        ).eq("user_id", user_id).order("created_at", desc=True).execute()
        
        if not tasks_result.data:
            return {"data": []}
        
        # Format response
        tasks = []
        for task in tasks_result.data:
            prep_steps = [
                PrepStep(
                    title=step["title"],
                    offset_minutes=step["offset_minutes"],
                    completed=step["completed"]
                )
                for step in task.get("prep_steps", [])
            ]
            
            tasks.append(TaskResponse(
                id=task["id"],
                user_id=task["user_id"],
                title=task["title"],
                description=task["description"],
                due_date=task["due_date"],
                category=task["category"],
                status=task["status"],
                prep_steps=prep_steps,
                created_at=task["created_at"],
                updated_at=task.get("updated_at")
            ))
        
        return {"data": tasks}
        
    except Exception as e:
        print(f"Error fetching tasks: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/tasks/{task_id}")
async def update_task(task_id: str, update_request: UpdateTaskRequest):
    if not supabase_client:
        raise HTTPException(status_code=500, detail="Database not available")
    
    try:
        # Update task status if provided
        if update_request.status:
            supabase_client.table("tasks").update({
                "status": update_request.status
            }).eq("id", task_id).execute()
        
        # Update prep steps if provided
        if update_request.prep_steps:
            # Delete existing prep steps
            supabase_client.table("prep_steps").delete().eq("task_id", task_id).execute()
            
            # Insert updated prep steps
            prep_steps_data = [
                {
                    "task_id": task_id,
                    "title": step.title,
                    "offset_minutes": step.offset_minutes,
                    "completed": step.completed
                }
                for step in update_request.prep_steps
            ]
            supabase_client.table("prep_steps").insert(prep_steps_data).execute()
        
        return {"success": True}
        
    except Exception as e:
        print(f"Error updating task: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/tasks/{task_id}")
async def delete_task(task_id: str):
    if not supabase_client:
        raise HTTPException(status_code=500, detail="Database not available")
    
    try:
        # Delete task (prep steps will cascade delete)
        supabase_client.table("tasks").delete().eq("id", task_id).execute()
        return {"success": True}
        
    except Exception as e:
        print(f"Error deleting task: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/stats/{user_id}")
async def get_user_stats(user_id: str):
    if not supabase_client:
        raise HTTPException(status_code=500, detail="Database not available")
    
    try:
        # Get all tasks for user
        tasks_result = supabase_client.table("tasks").select("*").eq("user_id", user_id).execute()
        tasks = tasks_result.data or []
        
        if not tasks:
            return {
                "streak_count": 0,
                "completion_rate": 0,
                "category_stats": {}
            }
        
        # Calculate stats
        completed_tasks = [t for t in tasks if t["status"] == "completed"]
        completion_rate = len(completed_tasks) / len(tasks) * 100 if tasks else 0
        
        # Category breakdown
        category_stats = {}
        for task in tasks:
            category = task["category"]
            if category not in category_stats:
                category_stats[category] = {"total": 0, "completed": 0}
            category_stats[category]["total"] += 1
            if task["status"] == "completed":
                category_stats[category]["completed"] += 1
        
        # Simple streak calculation (consecutive completed tasks)
        streak_count = 0
        for task in reversed(tasks):  # Most recent first
            if task["status"] == "completed":
                streak_count += 1
            else:
                break
        
        return {
            "streak_count": streak_count,
            "completion_rate": round(completion_rate, 1),
            "category_stats": category_stats
        }
        
    except Exception as e:
        print(f"Error calculating stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Vercel serverless function handler
def handler(request):
    return app(request)