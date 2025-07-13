import os
import json
from datetime import datetime, timezone
from typing import List, Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import google.generativeai as genai
from supabase import create_client, Client

# ── App setup ────────────────────────────────────────────────────────────────

app = FastAPI(
    title="ADHD Task Tracker API",
    version="1.0.0",
)

# Allow Next.js front-end & Vercel previews
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://*.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Globals & Initialization ────────────────────────────────────────────────

supabase_client: Optional[Client] = None
genai_model = None

def initialize_services():
    global supabase_client, genai_model

    # Supabase
    url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    if url and key:
        try:
            supabase_client = create_client(url, key)
            print("✅ Supabase client initialized")
        except Exception as e:
            print(f"⚠️ Supabase init failed: {e}")
    else:
        print("⚠️ Supabase credentials not found")

    # Gemini AI
    api_key = os.environ.get("GEMINI_API_KEY")
    if api_key:
        try:
            genai.configure(api_key=api_key)
            genai_model = genai.GenerativeModel("gemini-2.0-flash")
            print("✅ Gemini AI initialized")
        except Exception as e:
            print(f"⚠️ Gemini AI init failed: {e}")
    else:
        print("⚠️ Gemini API key not found")

@app.on_event("startup")
async def on_startup():
    initialize_services()

# ── Models ─────────────────────────────────────────────────────────────────

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

# ── Helpers ────────────────────────────────────────────────────────────────

def generate_prep_steps(title: str, due_date: str, category: str) -> List[PrepStep]:
    if not genai_model:
        # fallback defaults
        return [
            PrepStep(title="Gather materials needed", offset_minutes=-60),
            PrepStep(title="Set up workspace",       offset_minutes=-30),
            PrepStep(title="Final review & prep",    offset_minutes=-15),
        ]

    prompt = (
        f"You are an ADHD productivity coach. Task:\n"
        f"  Title: {title}\n"
        f"  Due:   {due_date}\n"
        f"  Category: {category}\n\n"
        "Generate 2-3 prep steps as a JSON array:\n"
        '[{"title":"Step","offset_minutes":-60}, ...]\n'
    )

    try:
        resp = genai_model.generate_content(prompt)
        text = resp.text.strip()
        data = json.loads(text)
        return [PrepStep(**step) for step in data]
    except Exception as e:
        print(f"AI generation failed: {e}")
        return [
            PrepStep(title="Gather materials needed",          offset_minutes=-60),
            PrepStep(title="Set up workspace & environment",    offset_minutes=-30),
            PrepStep(title="Final check & mental prep",         offset_minutes=-15),
        ]

# ── Endpoints ───────────────────────────────────────────────────────────────

@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now(timezone.utc).isoformat()}


@app.post("/tasks", response_model=TaskResponse)
async def create_task(req: CreateTaskRequest):
    if not supabase_client:
        raise HTTPException(500, "Database not available")

    # default due date = tomorrow @ 09:00 UTC
    if not req.due_date:
        tomorrow = datetime.now(timezone.utc).replace(hour=9, minute=0, second=0, microsecond=0)
        req.due_date = tomorrow.isoformat()

    steps = generate_prep_steps(req.title, req.due_date, req.category)

    # insert task
    task_data = {
        "user_id":   req.user_id,
        "title":     req.title,
        "description": req.description,
        "due_date":  req.due_date,
        "category":  req.category,
        "status":    "pending",
    }
    result = supabase_client.table("tasks").insert(task_data).execute()
    if not result.data:
        raise HTTPException(500, "Failed to create task")
    task = result.data[0]

    # insert prep steps
    records = [
        {
            "task_id":       task["id"],
            "title":         s.title,
            "offset_minutes": s.offset_minutes,
            "completed":     s.completed,
        }
        for s in steps
    ]
    supabase_client.table("prep_steps").insert(records).execute()

    return TaskResponse(
        id=task["id"],
        user_id=task["user_id"],
        title=task["title"],
        description=task["description"],
        due_date=task["due_date"],
        category=task["category"],
        status=task["status"],
        prep_steps=steps,
        created_at=task["created_at"],
        updated_at=task.get("updated_at"),
    )


@app.get("/tasks/{user_id}")
async def get_tasks(user_id: str):
    if not supabase_client:
        raise HTTPException(500, "Database not available")

    resp = (
        supabase_client.table("tasks")
        .select("*, prep_steps(*)")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .execute()
    )
    data = resp.data or []
    return {"data": [
        TaskResponse(
            id= t["id"],
            user_id= t["user_id"],
            title= t["title"],
            description= t["description"],
            due_date= t["due_date"],
            category= t["category"],
            status= t["status"],
            prep_steps=[
                PrepStep(**step) for step in t.get("prep_steps", [])
            ],
            created_at= t["created_at"],
            updated_at= t.get("updated_at"),
        )
        for t in data
    ]}


@app.put("/tasks/{task_id}")
async def update_task(task_id: str, req: UpdateTaskRequest):
    if not supabase_client:
        raise HTTPException(500, "Database not available")

    if req.status:
        supabase_client.table("tasks").update({"status": req.status}).eq("id", task_id).execute()
    if req.prep_steps:
        supabase_client.table("prep_steps").delete().eq("task_id", task_id).execute()
        supabase_client.table("prep_steps").insert([
            {
                "task_id":        task_id,
                "title":          s.title,
                "offset_minutes": s.offset_minutes,
                "completed":      s.completed,
            }
            for s in req.prep_steps
        ]).execute()

    return {"success": True}


@app.delete("/tasks/{task_id}")
async def delete_task(task_id: str):
    if not supabase_client:
        raise HTTPException(500, "Database not available")
    supabase_client.table("tasks").delete().eq("id", task_id).execute()
    return {"success": True}


@app.get("/stats/{user_id}")
async def get_user_stats(user_id: str):
    if not supabase_client:
        raise HTTPException(500, "Database not available")

    resp = supabase_client.table("tasks").select("*").eq("user_id", user_id).execute()
    tasks = resp.data or []
    if not tasks:
        return {"streak_count": 0, "completion_rate": 0, "category_stats": {}}

    completed = [t for t in tasks if t["status"] == "completed"]
    rate = len(completed) / len(tasks) * 100

    stats = {}
    for t in tasks:
        cat = t["category"]
        stats.setdefault(cat, {"total": 0, "completed": 0})
        stats[cat]["total"] += 1
        if t["status"] == "completed":
            stats[cat]["completed"] += 1

    # streak = consecutive completed from most recent
    streak = 0
    for t in reversed(tasks):
        if t["status"] == "completed":
            streak += 1
        else:
            break

    return {
        "streak_count":   streak,
        "completion_rate": round(rate, 1),
        "category_stats":  stats,
    }