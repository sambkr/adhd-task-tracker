import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import type { UpdateTaskRequest } from '@/types'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const { taskId } = await params
    const body = await request.json()
    const { status, prepSteps } = body as Omit<UpdateTaskRequest, 'id'>

    // Update task status if provided
    if (status) {
      const { error: updateError } = await supabase
        .from('tasks')
        .update({ status })
        .eq('id', taskId)

      if (updateError) {
        throw new Error(`Failed to update task: ${updateError.message}`)
      }
    }

    // Update prep steps if provided
    if (prepSteps) {
      // Delete existing prep steps
      const { error: deleteError } = await supabase
        .from('prep_steps')
        .delete()
        .eq('task_id', taskId)

      if (deleteError) {
        console.error('Failed to delete prep steps:', deleteError)
      }

      // Insert updated prep steps
      const prepStepsData = prepSteps.map(step => ({
        task_id: taskId,
        title: step.title,
        offset_minutes: step.offsetMinutes,
        completed: step.completed
      }))

      const { error: insertError } = await supabase
        .from('prep_steps')
        .insert(prepStepsData)

      if (insertError) {
        console.error('Failed to insert prep steps:', insertError)
      }
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error updating task:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error occurred' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const { taskId } = await params

    // Delete task (prep steps will cascade delete due to foreign key)
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId)

    if (error) {
      throw new Error(`Failed to delete task: ${error.message}`)
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error deleting task:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error occurred' },
      { status: 500 }
    )
  }
}