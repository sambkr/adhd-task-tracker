import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types';

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Mock user ID for development
const MOCK_USER_ID = "550e8400-e29b-41d4-a716-446655440000";

// Simple AI fallback for prep steps
function generateMockPrepSteps(title: string, category: string) {
  const baseSteps = [
    { title: "Gather materials and resources", offset_minutes: -60 },
    { title: "Set up workspace and environment", offset_minutes: -30 },
    { title: "Final check and mental preparation", offset_minutes: -15 }
  ];
  
  if (category === 'work') {
    return [
      { title: "Review project requirements", offset_minutes: -90 },
      { title: "Prepare workspace and tools", offset_minutes: -45 },
      { title: "Set focus timer and minimize distractions", offset_minutes: -15 }
    ];
  } else if (category === 'health') {
    return [
      { title: "Prepare workout clothes/equipment", offset_minutes: -30 },
      { title: "Set up water and snacks", offset_minutes: -15 },
      { title: "Do quick warm-up or stretches", offset_minutes: -5 }
    ];
  }
  
  return baseSteps;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, description = '', due_date, category = 'general', user_id } = body;

    // Set default due date if not provided
    let finalDueDate = due_date;
    if (!finalDueDate) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(9, 0, 0, 0);
      finalDueDate = tomorrow.toISOString();
    }

    // Create task in database
    const { data: taskData, error: taskError } = await supabase
      .from('tasks')
      .insert({
        user_id: user_id || MOCK_USER_ID,
        title,
        description,
        due_date: finalDueDate,
        category,
        status: 'pending'
      })
      .select()
      .single();

    if (taskError) {
      throw new Error(`Failed to create task: ${taskError.message}`);
    }

    // Generate and insert prep steps
    const prepSteps = generateMockPrepSteps(title, category);
    const prepStepsData = prepSteps.map(step => ({
      task_id: taskData.id,
      title: step.title,
      offset_minutes: step.offset_minutes,
      completed: false
    }));

    const { error: prepError } = await supabase
      .from('prep_steps')
      .insert(prepStepsData);

    if (prepError) {
      console.error('Failed to create prep steps:', prepError);
    }

    // Return complete task with prep steps
    return NextResponse.json({
      id: taskData.id,
      userId: taskData.user_id,
      title: taskData.title,
      description: taskData.description,
      dueDate: taskData.due_date,
      category: taskData.category,
      status: taskData.status,
      prepSteps: prepSteps.map(step => ({
        title: step.title,
        offsetMinutes: step.offset_minutes,
        completed: false
      })),
      createdAt: taskData.created_at,
      updatedAt: taskData.updated_at
    });

  } catch (error) {
    console.error('Error creating task:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error occurred' },
      { status: 500 }
    );
  }
}