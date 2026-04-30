'use server'

import { createClient } from '@/lib/supabase/server'
import { SearchResult } from '@/stores/searchStore'

export async function searchTasks(query: string): Promise<SearchResult[]> {
  const supabase = await createClient()

  try {
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return []

    // Get user's workspace
    const { data: workspaceMembers, error: workspaceError } = await supabase
      .from('workspace_members')
      .select('workspace_id')
      .eq('user_id', user.id)
      .limit(1)

    if (workspaceError || !workspaceMembers?.length) return []

    const workspaceId = workspaceMembers[0].workspace_id

    // Search in tasks
    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select('id, title, description, status, priority, due_date')
      .eq('workspace_id', workspaceId)
      .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
      .limit(10)

    if (tasksError) console.error('Tasks search error:', tasksError)

    // Search in calendar events
    const { data: events, error: eventsError } = await supabase
      .from('calendar_events')
      .select('id, title, description, start_at')
      .eq('workspace_id', workspaceId)
      .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
      .limit(10)

    if (eventsError) console.error('Events search error:', eventsError)

    // Combine and format results
    const results: SearchResult[] = [
      ...(tasks || []).map((task: any) => ({
        id: task.id,
        type: 'task' as const,
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        dueDate: task.due_date,
      })),
      ...(events || []).map((event: any) => ({
        id: event.id,
        type: 'event' as const,
        title: event.title,
        description: event.description,
        dueDate: event.start_at,
      })),
    ]

    return results
  } catch (error) {
    console.error('Search error:', error)
    return []
  }
}

export async function getRecentItems(): Promise<SearchResult[]> {
  const supabase = await createClient()

  try {
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return []

    // Get user's workspace
    const { data: workspaceMembers, error: workspaceError } = await supabase
      .from('workspace_members')
      .select('workspace_id')
      .eq('user_id', user.id)
      .limit(1)

    if (workspaceError || !workspaceMembers?.length) return []

    const workspaceId = workspaceMembers[0].workspace_id

    // Get recent tasks
    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select('id, title, description, status, priority, due_date')
      .eq('workspace_id', workspaceId)
      .order('updated_at', { ascending: false })
      .limit(2)

    if (tasksError) console.error('Recent tasks error:', tasksError)

    // Get recent calendar events
    const { data: events, error: eventsError } = await supabase
      .from('calendar_events')
      .select('id, title, description, start_at')
      .eq('workspace_id', workspaceId)
      .order('updated_at', { ascending: false })
      .limit(2)

    if (eventsError) console.error('Recent events error:', eventsError)

    // Combine and format results
    const results: SearchResult[] = [
      ...(tasks || []).map((task: any) => ({
        id: task.id,
        type: 'task' as const,
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        dueDate: task.due_date,
      })),
      ...(events || []).map((event: any) => ({
        id: event.id,
        type: 'event' as const,
        title: event.title,
        description: event.description,
        dueDate: event.start_at,
      })),
    ]

    return results
  } catch (error) {
    console.error('Recent items error:', error)
    return []
  }
}
