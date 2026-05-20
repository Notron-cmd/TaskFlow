'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// ============ SUBTASKS ============

export async function getSubtasks(taskId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('task_subtasks')
    .select('*')
    .eq('task_id', taskId)
    .order('position', { ascending: true })

  if (error) {
    console.error('Error fetching subtasks:', error)
    return null
  }

  return data
}

export async function createSubtask(
  taskId: string,
  data: {
    title: string
    description?: string
  }
) {
  const supabase = await createClient()

  // Get max position
  const { data: existing } = await supabase
    .from('task_subtasks')
    .select('position')
    .eq('task_id', taskId)
    .order('position', { ascending: false })
    .limit(1)

  const position = (existing?.[0]?.position ?? -1) + 1

  const { data: subtask, error } = await supabase
    .from('task_subtasks')
    .insert({
      task_id: taskId,
      ...data,
      position,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating subtask:', error)
    return null
  }

  revalidatePath('/board')
  return subtask
}

export async function updateSubtask(
  subtaskId: string,
  updates: {
    title?: string
    description?: string
    completed?: boolean
  }
) {
  const supabase = await createClient()

  const { data: subtask, error } = await supabase
    .from('task_subtasks')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', subtaskId)
    .select()
    .single()

  if (error) {
    console.error('Error updating subtask:', error)
    return null
  }

  revalidatePath('/board')
  return subtask
}

export async function deleteSubtask(subtaskId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('task_subtasks')
    .delete()
    .eq('id', subtaskId)

  if (error) {
    console.error('Error deleting subtask:', error)
    return false
  }

  revalidatePath('/board')
  return true
}

export async function reorderSubtasks(
  taskId: string,
  subtaskIds: string[]
) {
  const supabase = await createClient()

  // Update positions
  for (let i = 0; i < subtaskIds.length; i++) {
    await supabase
      .from('task_subtasks')
      .update({ position: i, updated_at: new Date().toISOString() })
      .eq('id', subtaskIds[i])
  }

  revalidatePath('/board')
  return true
}

export async function toggleSubtaskComplete(
  subtaskId: string,
  completed: boolean
) {
  const supabase = await createClient()

  const { data: subtask, error } = await supabase
    .from('task_subtasks')
    .update({
      completed,
      updated_at: new Date().toISOString(),
    })
    .eq('id', subtaskId)
    .select()
    .single()

  if (error) {
    console.error('Error toggling subtask:', error)
    return null
  }

  revalidatePath('/board')
  return subtask
}

// ============ TIME TRACKING ============

export async function createTimeLog(
  taskId: string,
  data: {
    durationMinutes: number
    description?: string
  }
) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('User not authenticated')
  }

  const now = new Date()
  const startedAt = new Date(now.getTime() - data.durationMinutes * 60000)

  const { data: log, error } = await supabase
    .from('task_time_logs')
    .insert({
      task_id: taskId,
      user_id: user.id,
      duration_minutes: data.durationMinutes,
      description: data.description,
      started_at: startedAt.toISOString(),
      ended_at: now.toISOString(),
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating time log:', error)
    return null
  }

  // Update task's total_time_spent_minutes
  const { data: currentTask } = await supabase
    .from('tasks')
    .select('total_time_spent_minutes')
    .eq('id', taskId)
    .single()

  const totalSpent = (currentTask?.total_time_spent_minutes || 0) + data.durationMinutes

  await supabase
    .from('tasks')
    .update({ total_time_spent_minutes: totalSpent })
    .eq('id', taskId)

  revalidatePath('/board')
  return log
}

export async function getTimeLogs(taskId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('task_time_logs')
    .select('*, profiles(id, full_name, avatar_url)')
    .eq('task_id', taskId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching time logs:', error)
    return null
  }

  return data
}

export async function deleteTimeLog(logId: string, durationMinutes: number) {
  const supabase = await createClient()

  // Get the task_id from the log
  const { data: log } = await supabase
    .from('task_time_logs')
    .select('task_id')
    .eq('id', logId)
    .single()

  if (!log) return false

  // Delete the log
  const { error } = await supabase
    .from('task_time_logs')
    .delete()
    .eq('id', logId)

  if (error) {
    console.error('Error deleting time log:', error)
    return false
  }

  // Update task's total time
  const { data: currentTask } = await supabase
    .from('tasks')
    .select('total_time_spent_minutes')
    .eq('id', log.task_id)
    .single()

  const totalSpent = Math.max(0, (currentTask?.total_time_spent_minutes || 0) - durationMinutes)

  await supabase
    .from('tasks')
    .update({ total_time_spent_minutes: totalSpent })
    .eq('id', log.task_id)

  revalidatePath('/board')
  return true
}

export async function updateTaskEstimate(taskId: string, estimatedHours: number) {
  const supabase = await createClient()

  const { data: task, error } = await supabase
    .from('tasks')
    .update({ estimated_hours: estimatedHours })
    .eq('id', taskId)
    .select()
    .single()

  if (error) {
    console.error('Error updating task estimate:', error)
    return null
  }

  revalidatePath('/board')
  return task
}
