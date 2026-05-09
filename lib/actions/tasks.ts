'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { taskSchema, type TaskInput } from '@/lib/validations/task.schema'
import type { Database } from '@/types/database.types'

type Task = Database['public']['Tables']['tasks']['Row']

export async function createTask(data: TaskInput): Promise<Task> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  const validation = taskSchema.safeParse(data)
  if (!validation.success) {
    throw new Error(validation.error.issues[0].message)
  }

  const { data: task, error } = await supabase
    .from('tasks')
    .insert({
      ...validation.data,
      created_by: user.id,
    })
    .select()
    .single()

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/board')
  return task
}

export async function updateTask(
  taskId: string,
  updates: Partial<TaskInput>
): Promise<Task> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  const { data: task, error } = await supabase
    .from('tasks')
    .update(updates)
    .eq('id', taskId)
    .select()
    .single()

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/board')
  revalidatePath('/calendar')
  return task
}

export async function deleteTask(taskId: string): Promise<void> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  const { error } = await supabase.from('tasks').delete().eq('id', taskId)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/board')
  revalidatePath('/calendar')
}

export async function moveTask(
  taskId: string,
  newStatus: 'todo' | 'in_progress' | 'done',
  newPosition: number
): Promise<void> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  const { error } = await supabase.rpc('move_task', {
    p_task_id: taskId,
    p_new_status: newStatus,
    p_new_position: newPosition,
  })

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/board')
}

export async function setTaskDueDate(
  taskId: string,
  dueDate: Date | null
): Promise<{ id: string; due_date: string | null; calendar_event_id: string | null }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  // First, update the due_date (trigger will fire here)
  const { error: updateError } = await supabase
    .from('tasks')
    .update({ due_date: dueDate?.toISOString() ?? null })
    .eq('id', taskId)

  if (updateError) {
    throw new Error(updateError.message)
  }

  // Then, fetch the updated task separately to avoid trigger conflicts
  const { data, error: fetchError } = await supabase
    .from('tasks')
    .select('id, due_date, calendar_event_id')
    .eq('id', taskId)
    .single()

  if (fetchError) {
    throw new Error(fetchError.message)
  }

  revalidatePath('/board')
  revalidatePath('/calendar')
  return data
}

export async function assignTask(
  taskId: string,
  userIds: string[]
): Promise<void> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  const { error: deleteError } = await supabase
    .from('task_assignees')
    .delete()
    .eq('task_id', taskId)

  if (deleteError) {
    throw new Error(deleteError.message)
  }

  if (userIds.length > 0) {
    const { error: insertError } = await supabase.from('task_assignees').insert(
      userIds.map((uid) => ({
        task_id: taskId,
        user_id: uid,
      }))
    )

    if (insertError) {
      throw new Error(insertError.message)
    }
  }

  revalidatePath('/board')
}

/**
 * Archive a task (soft delete)
 */
export async function archiveTask(taskId: string): Promise<Task> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  const { data: task, error } = await supabase
    .from('tasks')
    .update({
      is_archived: true,
      archived_at: new Date().toISOString(),
    })
    .eq('id', taskId)
    .select()
    .single()

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/board')
  revalidatePath('/calendar')
  return task
}

/**
 * Restore an archived task
 */
export async function restoreTask(taskId: string): Promise<Task> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  const { data: task, error } = await supabase
    .from('tasks')
    .update({
      is_archived: false,
      archived_at: null,
    })
    .eq('id', taskId)
    .select()
    .single()

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/board')
  revalidatePath('/calendar')
  return task
}

/**
 * Permanently delete an archived task
 */
export async function permanentlyDeleteTask(taskId: string): Promise<void> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  // Check if task is archived
  const { data: task, error: fetchError } = await supabase
    .from('tasks')
    .select('is_archived')
    .eq('id', taskId)
    .single()

  if (fetchError) {
    throw new Error(fetchError.message)
  }

  if (!task.is_archived) {
    throw new Error('Can only permanently delete archived tasks')
  }

  const { error: deleteError } = await supabase
    .from('tasks')
    .delete()
    .eq('id', taskId)

  if (deleteError) {
    throw new Error(deleteError.message)
  }

  revalidatePath('/archive')
}
