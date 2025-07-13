import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import type { UserStats } from '@/types'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params

    // Get all tasks for user
    const { data: tasks, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)

    if (error) {
      throw new Error(`Failed to fetch tasks: ${error.message}`)
    }

    const allTasks = tasks || []

    if (allTasks.length === 0) {
      const emptyStats: UserStats = {
        streakCount: 0,
        completionRate: 0,
        categoryStats: {}
      }
      return NextResponse.json(emptyStats)
    }

    // Calculate stats
    const completedTasks = allTasks.filter(t => t.status === 'completed')
    const completionRate = (completedTasks.length / allTasks.length) * 100

    // Category breakdown
    const categoryStats: Record<string, number> = {}
    for (const task of allTasks) {
      const category = task.category || 'general'
      if (!categoryStats[category]) {
        categoryStats[category] = 0
      }
      if (task.status === 'completed') {
        categoryStats[category]++
      }
    }

    // Simple streak calculation (consecutive completed tasks from most recent)
    let streakCount = 0
    const sortedTasks = allTasks.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
    
    for (const task of sortedTasks) {
      if (task.status === 'completed') {
        streakCount++
      } else {
        break
      }
    }

    const stats: UserStats = {
      streakCount,
      completionRate: Math.round(completionRate * 10) / 10,
      categoryStats
    }

    return NextResponse.json(stats)

  } catch (error) {
    console.error('Error calculating stats:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error occurred' },
      { status: 500 }
    )
  }
}