'use client'

import { useState, useEffect, useCallback } from 'react'
import { useTimerStore } from '@/stores/timerStore'

export function useTimer(taskId: string) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const {
    sessions,
    activeTaskId,
    totalTimeByTask,
    startTimer,
    pauseTimer,
    resumeTimer,
    stopTimer,
    resetTimer,
    getElapsedTime,
    setTotalTimeByTask,
  } = useTimerStore()

  const session = sessions[taskId]
  const isRunning = session?.isRunning ?? false
  const totalMinutes = totalTimeByTask[taskId] || 0

  // Update elapsed time every second if running
  useEffect(() => {
    if (!isRunning) return

    const interval = setInterval(() => {
      const elapsed = getElapsedTime(taskId)
      setElapsedSeconds(elapsed)
    }, 1000)

    return () => clearInterval(interval)
  }, [isRunning, taskId, getElapsedTime])

  // Update elapsed when session changes
  useEffect(() => {
    const elapsed = getElapsedTime(taskId)
    setElapsedSeconds(elapsed)
  }, [session, taskId, getElapsedTime])

  const handleStart = useCallback(() => {
    startTimer(taskId)
  }, [taskId, startTimer])

  const handlePause = useCallback(() => {
    pauseTimer(taskId)
  }, [taskId, pauseTimer])

  const handleResume = useCallback(() => {
    resumeTimer(taskId)
  }, [taskId, resumeTimer])

  const handleStop = useCallback(async () => {
    const minutes = await stopTimer(taskId)
    setTotalTimeByTask(taskId, (totalTimeByTask[taskId] || 0) + minutes)
    return minutes
  }, [taskId, stopTimer, totalTimeByTask, setTotalTimeByTask])

  const handleReset = useCallback(() => {
    resetTimer(taskId)
    setElapsedSeconds(0)
  }, [taskId, resetTimer])

  return {
    elapsedSeconds,
    totalMinutes,
    isRunning,
    hasSession: !!session,
    start: handleStart,
    pause: handlePause,
    resume: handleResume,
    stop: handleStop,
    reset: handleReset,
    formatTime: (seconds: number) => {
      const hours = Math.floor(seconds / 3600)
      const mins = Math.floor((seconds % 3600) / 60)
      const secs = seconds % 60

      if (hours > 0) {
        return `${hours}h ${mins}m ${secs}s`
      }
      return `${mins}m ${secs}s`
    },
  }
}

export function useTimeTracking(taskId: string, estimatedHours?: number) {
  const [timeLogs, setTimeLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [totalSpent, setTotalSpent] = useState(0)

  // Fetch time logs
  const fetchTimeLogs = useCallback(async () => {
    setLoading(true)
    try {
      const { getTimeLogs } = await import('@/lib/actions/subtasks-and-timers')
      const logs = await getTimeLogs(taskId)
      if (logs) {
        setTimeLogs(logs)
        const total = logs.reduce(
          (sum: number, log: any) => sum + (log.duration_minutes || 0),
          0
        )
        setTotalSpent(total)
      }
    } catch (error) {
      console.error('Error fetching time logs:', error)
    } finally {
      setLoading(false)
    }
  }, [taskId])

  // Add time log
  const addTimeLog = useCallback(
    async (durationMinutes: number, description?: string) => {
      try {
        const { createTimeLog } = await import('@/lib/actions/subtasks-and-timers')
        const log = await createTimeLog(taskId, { durationMinutes, description })
        if (log) {
          setTotalSpent((prev) => prev + durationMinutes)
          await fetchTimeLogs()
          return true
        }
      } catch (error) {
        console.error('Error adding time log:', error)
      }
      return false
    },
    [taskId, fetchTimeLogs]
  )

  // Delete time log
  const removeTimeLog = useCallback(
    async (logId: string, durationMinutes: number) => {
      try {
        const { deleteTimeLog } = await import('@/lib/actions/subtasks-and-timers')
        const success = await deleteTimeLog(logId, durationMinutes)
        if (success) {
          setTotalSpent((prev) => Math.max(0, prev - durationMinutes))
          await fetchTimeLogs()
          return true
        }
      } catch (error) {
        console.error('Error removing time log:', error)
      }
      return false
    },
    [fetchTimeLogs]
  )

  useEffect(() => {
    fetchTimeLogs()
  }, [fetchTimeLogs])

  const progress =
    estimatedHours && totalSpent > 0
      ? Math.round((totalSpent / (estimatedHours * 60)) * 100)
      : 0

  return {
    timeLogs,
    totalSpent,
    loading,
    progress,
    estimatedHours,
    addTimeLog,
    removeTimeLog,
    refetch: fetchTimeLogs,
  }
}
