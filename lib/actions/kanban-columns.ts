'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export interface KanbanColumnInput {
  name: string
  color?: string
  icon?: string
  wip_limit?: number | null
}

/**
 * Get all kanban columns for a workspace
 */
export async function getKanbanColumns(workspaceId: string): Promise<any[]> {
  const supabase = await createClient()

  const { data: columns, error } = await supabase
    .from('kanban_columns')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('position', { ascending: true })

  if (error) {
    console.error('[getKanbanColumns] Error:', {
      code: error.code,
      message: error.message,
      details: error.details,
      workspaceId
    })
    throw new Error(`Failed to fetch kanban columns: ${error.message}`)
  }

  if (!columns || columns.length === 0) {
    console.warn('[getKanbanColumns] No columns found for workspace', { workspaceId })
  }

  return columns || []
}

/**
 * Create a new kanban column
 */
export async function createKanbanColumn(
  workspaceId: string,
  data: KanbanColumnInput
): Promise<any> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Not authenticated')
  }

  // Check if user has permission to modify workspace
  const { data: membership, error: membershipError } = await supabase
    .from('workspace_members')
    .select('role')
    .eq('workspace_id', workspaceId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (membershipError || !membership || !['owner', 'admin'].includes(membership.role)) {
    throw new Error('You do not have permission to modify this workspace')
  }

  // Get the highest position
  const { data: lastColumn } = await supabase
    .from('kanban_columns')
    .select('position')
    .eq('workspace_id', workspaceId)
    .order('position', { ascending: false })
    .limit(1)
    .single()

  const newPosition = (lastColumn?.position ?? -1) + 1

  // Create a unique status identifier
  const statusId = data.name.toLowerCase().replace(/\s+/g, '_')

  const { data: column, error } = await supabase
    .from('kanban_columns')
    .insert([
      {
        workspace_id: workspaceId,
        name: data.name,
        color: data.color || '#94A3B8',
        icon: data.icon || 'circle',
        status: statusId,
        position: newPosition,
        wip_limit: data.wip_limit || null,
      },
    ])
    .select()
    .single()

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/board')
  return column
}

/**
 * Update a kanban column
 */
export async function updateKanbanColumn(
  columnId: string,
  data: Partial<KanbanColumnInput>
): Promise<any> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Not authenticated')
  }

  // Get column first to check permissions
  const { data: column } = await supabase
    .from('kanban_columns')
    .select('workspace_id')
    .eq('id', columnId)
    .single()

  if (!column) {
    throw new Error('Column not found')
  }

  const { data: membership, error: membershipError } = await supabase
    .from('workspace_members')
    .select('role')
    .eq('workspace_id', column.workspace_id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (membershipError || !membership || !['owner', 'admin'].includes(membership.role)) {
    throw new Error('You do not have permission to modify this workspace')
  }

  const { data: updatedColumn, error } = await supabase
    .from('kanban_columns')
    .update({
      ...data,
      updated_at: new Date().toISOString(),
    })
    .eq('id', columnId)
    .select()
    .single()

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/board')
  return updatedColumn
}

/**
 * Delete a kanban column
 */
export async function deleteKanbanColumn(columnId: string): Promise<void> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Not authenticated')
  }

  // Get column first to check permissions
  const { data: column } = await supabase
    .from('kanban_columns')
    .select('workspace_id')
    .eq('id', columnId)
    .single()

  if (!column) {
    throw new Error('Column not found')
  }

  const { data: membership, error: membershipError } = await supabase
    .from('workspace_members')
    .select('role')
    .eq('workspace_id', column.workspace_id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (membershipError || !membership || !['owner', 'admin'].includes(membership.role)) {
    throw new Error('You do not have permission to modify this workspace')
  }

  // Can't delete if there are tasks in this column
  const { count } = await supabase
    .from('tasks')
    .select('id', { count: 'exact' })
    .eq('status', (await supabase.from('kanban_columns').select('status').eq('id', columnId).single()).data?.status)

  if (count && count > 0) {
    throw new Error('Cannot delete column with existing tasks. Move or delete tasks first.')
  }

  const { error } = await supabase.from('kanban_columns').delete().eq('id', columnId)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/board')
}

/**
 * Reorder kanban columns
 */
export async function reorderKanbanColumns(
  workspaceId: string,
  columnOrder: Array<{ id: string; position: number }>
): Promise<void> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Not authenticated')
  }

  // Check permissions
  const { data: membership, error: membershipError } = await supabase
    .from('workspace_members')
    .select('role')
    .eq('workspace_id', workspaceId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (membershipError || !membership || !['owner', 'admin'].includes(membership.role)) {
    throw new Error('You do not have permission to modify this workspace')
  }

  // Update positions for all columns
  for (const { id, position } of columnOrder) {
    await supabase
      .from('kanban_columns')
      .update({ position, updated_at: new Date().toISOString() })
      .eq('id', id)
  }

  revalidatePath('/board')
}
