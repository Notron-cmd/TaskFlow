/**
 * Rate limiting utility untuk mencegah brute force
 * Menggunakan in-memory store (atau Redis untuk production)
 */

interface RateLimitEntry {
  count: number
  resetTime: number
}

// In-memory store (untuk development)
// Untuk production, gunakan Redis
const rateLimitStore = new Map<string, RateLimitEntry>()

/**
 * Rate limit by user ID + action
 * @param userId - User ID
 * @param action - Action identifier (e.g., 'get_subtasks', 'create_subtask')
 * @param maxRequests - Max requests allowed
 * @param windowMs - Time window in milliseconds
 * @returns true if request allowed, false if rate limited
 */
export function checkRateLimit(
  userId: string,
  action: string,
  maxRequests: number = 100,
  windowMs: number = 60000 // 1 minute default
): boolean {
  const key = `${userId}:${action}`
  const now = Date.now()
  const entry = rateLimitStore.get(key)

  // New entry or expired window
  if (!entry || now > entry.resetTime) {
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + windowMs,
    })
    return true
  }

  // Check if under limit
  if (entry.count < maxRequests) {
    entry.count++
    return true
  }

  // Rate limited
  return false
}

/**
 * Get remaining requests
 */
export function getRateLimitStatus(
  userId: string,
  action: string,
  maxRequests: number = 100
) {
  const key = `${userId}:${action}`
  const entry = rateLimitStore.get(key)
  const now = Date.now()

  if (!entry || now > entry.resetTime) {
    return {
      remaining: maxRequests,
      resetAt: new Date(now + 60000),
    }
  }

  return {
    remaining: Math.max(0, maxRequests - entry.count),
    resetAt: new Date(entry.resetTime),
  }
}

/**
 * Clear rate limit for user (admin only)
 */
export function clearRateLimit(userId: string, action?: string) {
  if (action) {
    rateLimitStore.delete(`${userId}:${action}`)
  } else {
    // Clear all actions for user
    for (const key of rateLimitStore.keys()) {
      if (key.startsWith(`${userId}:`)) {
        rateLimitStore.delete(key)
      }
    }
  }
}

/**
 * Rate limit presets untuk different actions
 */
export const RATE_LIMIT_PRESETS = {
  // Read operations - more lenient
  READ: { maxRequests: 1000, windowMs: 60000 }, // 1000 per minute
  
  // Write operations - strict
  WRITE: { maxRequests: 100, windowMs: 60000 }, // 100 per minute
  
  // Expensive operations - very strict
  EXPENSIVE: { maxRequests: 10, windowMs: 60000 }, // 10 per minute
  
  // Login - very strict (prevent password brute force)
  LOGIN: { maxRequests: 5, windowMs: 300000 }, // 5 per 5 minutes
}
