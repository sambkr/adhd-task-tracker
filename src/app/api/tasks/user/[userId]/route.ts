import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import type { Task } from '@/types'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params

    // Get tasks with prep steps
    const { data: tasks, error } = await supabase
      .from('tasks')
      .select(`
        *,
        prep_steps (*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Failed to fetch tasks: ${error.message}`)
    }

    // Format response to match expected interface
    const formattedTasks: Task[] = (tasks || []).map(task => ({
      id: task.id,
      userId: task.user_id,
      title: task.title,
      description: task.description || '',
      dueDate: task.due_date,
      category: task.category || 'general',
      status: task.status || 'pending',
      prepSteps: (task.prep_steps || []).map((step: { title: string; offset_minutes: number; completed: boolean }) => ({
        title: step.title,
        offsetMinutes: step.offset_minutes,
        completed: step.completed
      })),
      createdAt: task.created_at,
      updatedAt: task.updated_at
    }))

    return NextResponse.json({ data: formattedTasks })

  } catch (error) {
    console.error('Error fetching tasks:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error occurred' },
      { status: 500 }
    )
  }
}