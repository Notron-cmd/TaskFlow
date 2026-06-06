// Performance optimization utilities
import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/types/database.types'

type Task = Database['public']['Tables']['tasks']['Row']

export interface PaginationParams {
  page?: number
  limit?: number
  offset?: number
}

export interface PaginatedResult<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
  hasMore: boolean
}

// Cache configuration
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes
const cache = new Map<string, { data: any; timestamp: number }>()

/**
 * Get cached data or fetch fresh data
 */
function getCachedOrFetch<T>(
  key: string,
  fetchFn: () => Promise<T>,
  duration: number = CACHE_DURATION
): Promise<T> {
  const cached = cache.get(key)
  const now = Date.now()

  if (cached && now - cached.timestamp < duration) {
    return Promise.resolve(cached.data as T)
  }

  return fetchFn().then(data => {
    cache.set(key, { data, timestamp: now })
    return data
  })
}

/**
 * Get tasks with pagination
 */
export async function getTasksPaginated(
  workspaceId: string,
  params: PaginationParams = {}
): Promise<PaginatedResult<Task>> {
  const limit = params.limit || 20
  const page = params.page || 1
  const offset = params.offset || (page - 1) * limit

  const supabase = await createClient()

  // Get total count
  const { count, error: countError } = await supabase
    .from('tasks')
    .select('id', { count: 'exact', head: true })
    .eq('workspace_id', workspaceId)
    .eq('is_archived', false)

  if (countError) throw new Error(countError.message)

  const total = count || 0

  // Get paginated data
  const { data, error } = await supabase
    .from('tasks')
    .select(`
      *,
      task_assignees (
        profiles (
          id,
          full_name,
          avatar_url
        )
      )
    `)
    .eq('workspace_id', workspaceId)
    .eq('is_archived', false)
    .order('position', { ascending: true })
    .range(offset, offset + limit - 1)

  if (error) throw new Error(error.message)

  const totalPages = Math.ceil(total / limit)

  return {
    data: data || [],
    total,
    page,
    limit,
    totalPages,
    hasMore: page < totalPages,
  }
}

/**
 * Get tasks by status with pagination and caching
 */
export async function getTasksByStatusPaginated(
  workspaceId: string,
  status: 'todo' | 'in_progress' | 'done',
  params: PaginationParams = {},
  useCache: boolean = true
): Promise<PaginatedResult<Task>> {
  const cacheKey = `tasks:${workspaceId}:${status}:${params.page || 1}:${params.limit || 20}`

  if (useCache) {
    return getCachedOrFetch(cacheKey, () =>
      getTasksByStatusPaginatedUncached(workspaceId, status, params)
    )
  }

  return getTasksByStatusPaginatedUncached(workspaceId, status, params)
}

async function getTasksByStatusPaginatedUncached(
  workspaceId: string,
  status: 'todo' | 'in_progress' | 'done',
  params: PaginationParams = {}
): Promise<PaginatedResult<Task>> {
  const limit = params.limit || 20
  const page = params.page || 1
  const offset = params.offset || (page - 1) * limit

  const supabase = await createClient()

  // Get count
  const { count, error: countError } = await supabase
    .from('tasks')
    .select('id', { count: 'exact', head: true })
    .eq('workspace_id', workspaceId)
    .eq('status', status)
    .eq('is_archived', false)

  if (countError) throw new Error(countError.message)

  const total = count || 0

  // Get data
  const { data, error } = await supabase
    .from('tasks')
    .select(`
      *,
      task_assignees (
        profiles (
          id,
          full_name,
          avatar_url
        )
      )
    `)
    .eq('workspace_id', workspaceId)
    .eq('status', status)
    .eq('is_archived', false)
    .order('position', { ascending: true })
    .range(offset, offset + limit - 1)

  if (error) throw new Error(error.message)

  const totalPages = Math.ceil(total / limit)

  return {
    data: data || [],
    total,
    page,
    limit,
    totalPages,
    hasMore: page < totalPages,
  }
}

/**
 * Search tasks with pagination
 */
export async function searchTasksPaginated(
  workspaceId: string,
  searchTerm: string,
  params: PaginationParams = {}
): Promise<PaginatedResult<Task>> {
  const limit = params.limit || 20
  const page = params.page || 1
  const offset = params.offset || (page - 1) * limit

  const supabase = await createClient()

  // Search using full-text search
  const { count, error: countError } = await supabase
    .from('tasks')
    .select('id', { count: 'exact', head: true })
    .eq('workspace_id', workspaceId)
    .eq('is_archived', false)
    .or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)

  if (countError) throw new Error(countError.message)

  const total = count || 0

  const { data, error } = await supabase
    .from('tasks')
    .select(`
      *,
      task_assignees (
        profiles (
          id,
          full_name,
          avatar_url
        )
      )
    `)
    .eq('workspace_id', workspaceId)
    .eq('is_archived', false)
    .or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) throw new Error(error.message)

  const totalPages = Math.ceil(total / limit)

  return {
    data: data || [],
    total,
    page,
    limit,
    totalPages,
    hasMore: page < totalPages,
  }
}

/**
 * Get tasks by priority with pagination
 */
export async function getTasksByPriorityPaginated(
  workspaceId: string,
  priority: 'low' | 'medium' | 'high' | 'urgent',
  params: PaginationParams = {}
): Promise<PaginatedResult<Task>> {
  const limit = params.limit || 20
  const page = params.page || 1
  const offset = params.offset || (page - 1) * limit

  const supabase = await createClient()

  const { count, error: countError } = await supabase
    .from('tasks')
    .select('id', { count: 'exact', head: true })
    .eq('workspace_id', workspaceId)
    .eq('priority', priority)
    .eq('is_archived', false)

  if (countError) throw new Error(countError.message)

  const total = count || 0

  const { data, error } = await supabase
    .from('tasks')
    .select(`
      *,
      task_assignees (
        profiles (
          id,
          full_name,
          avatar_url
        )
      )
    `)
    .eq('workspace_id', workspaceId)
    .eq('priority', priority)
    .eq('is_archived', false)
    .order('position', { ascending: true })
    .range(offset, offset + limit - 1)

  if (error) throw new Error(error.message)

  const totalPages = Math.ceil(total / limit)

  return {
    data: data || [],
    total,
    page,
    limit,
    totalPages,
    hasMore: page < totalPages,
  }
}

/**
 * Invalidate cache for a workspace
 */
export function invalidateTaskCache(workspaceId: string, status?: string) {
  for (const key of cache.keys()) {
    if (key.includes(`tasks:${workspaceId}`)) {
      if (!status || key.includes(`:${status}:`)) {
        cache.delete(key)
      }
    }
  }
}

/**
 * Clear all cache
 */
export function clearAllCache() {
  cache.clear()
}

/**
 * Get cache statistics
 */
export function getCacheStats() {
  return {
    size: cache.size,
    entries: Array.from(cache.keys()),
  }
}
