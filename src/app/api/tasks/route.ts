import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { generatePrepSteps } from '@/lib/prepSteps'
import type { CreateTaskRequest, Task } from '@/types'

const MOCK_USER_ID = "550e8400-e29b-41d4-a716-446655440000"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as CreateTaskRequest & { user_id?: string }
    const { title, description = '', dueDate, category = 'general', user_id } = body

    // Set default due date if not provided
    let finalDueDate = dueDate
    if (!finalDueDate) {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      tomorrow.setUTCHours(9, 0, 0, 0)
      finalDueDate = tomorrow.toISOString()
    }

    // Generate prep steps
    const prepSteps = await generatePrepSteps(title, finalDueDate, category)

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
      .single()

    if (taskError) {
      throw new Error(`Failed to create task: ${taskError.message}`)
    }

    // Insert prep steps
    const prepStepsData = prepSteps.map(step => ({
      task_id: taskData.id,
      title: step.title,
      offset_minutes: step.offsetMinutes,
      completed: step.completed
    }))

    const { error: prepError } = await supabase
      .from('prep_steps')
      .insert(prepStepsData)

    if (prepError) {
      console.error('Failed to create prep steps:', prepError)
    }

    // Return complete task response
    const response: Task = {
      id: taskData.id,
      userId: taskData.user_id,
      title: taskData.title,
      description: taskData.description || '',
      dueDate: taskData.due_date,
      category: taskData.category,
      status: taskData.status,
      prepSteps,
      createdAt: taskData.created_at,
      updatedAt: taskData.updated_at
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Error creating task:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error occurred' },
      { status: 500 }
    )
  }
}