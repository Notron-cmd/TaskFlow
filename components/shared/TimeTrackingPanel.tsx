'use client'

import { useState } from 'react'
import { Clock, Trash2, Plus, ChevronDown } from 'lucide-react'
import { useTimeTracking } from '@/hooks/useTimer'
import { useThemeColor } from '@/hooks/useThemeColor'
import { toast } from '@/hooks/use-toast'

interface TimeTrackingPanelProps {
  taskId: string
  estimatedHours?: number
  onEstimateChange?: (hours: number) => void
  compact?: boolean
}

export function TimeTrackingPanel({
  taskId,
  estimatedHours,
  onEstimateChange,
  compact = false,
}: TimeTrackingPanelProps) {
  const { primary } = useThemeColor()
  const { timeLogs, totalSpent, progress, loading, addTimeLog, removeTimeLog } = useTimeTracking(
    taskId,
    estimatedHours
  )
  const [showInput, setShowInput] = useState(false)
  const [showLogs, setShowLogs] = useState(!compact)
  const [hours, setHours] = useState(0)
  const [minutes, setMinutes] = useState(0)
  const [description, setDescription] = useState('')
  const [isAdding, setIsAdding] = useState(false)

  const handleAddLog = async () => {
    const totalMinutes = hours * 60 + minutes
    if (totalMinutes <= 0) {
      toast.error('Please enter a valid duration')
      return
    }

    setIsAdding(true)
    const success = await addTimeLog(totalMinutes, description)
    setIsAdding(false)

    if (success) {
      setHours(0)
      setMinutes(0)
      setDescription('')
      setShowInput(false)
      toast.success('Time logged')
    } else {
      toast.error('Failed to log time')
    }
  }

  const handleDeleteLog = async (logId: string, duration: number) => {
    const success = await removeTimeLog(logId, duration)
    if (success) {
      toast.success('Log deleted')
    } else {
      toast.error('Failed to delete log')
    }
  }

  const hoursSpent = Math.floor(totalSpent / 60)
  const minutesSpent = totalSpent % 60

  if (compact && totalSpent === 0) {
    return null
  }

  return (
    <div className="space-y-3">
      {/* Header with Summary */}
      <div
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setShowLogs(!showLogs)}
      >
        <div className="flex items-center gap-2">
          <Clock size={16} className="text-slate-500" />
          <h3 className="text-sm font-semibold text-white">Time Tracking</h3>
          <div className="flex items-center gap-1 text-xs">
            <span className="text-slate-400">
              {hoursSpent}h {minutesSpent}m
            </span>
            {estimatedHours && (
              <>
                <span className="text-slate-600">/</span>
                <span className="text-slate-400">{estimatedHours}h est.</span>
              </>
            )}
          </div>
        </div>
        <ChevronDown
          size={16}
          className={`text-slate-500 transition-transform ${showLogs ? '' : '-rotate-90'}`}
        />
      </div>

      {/* Progress Bar */}
      {estimatedHours && totalSpent > 0 && (
        <div className="space-y-1">
          <div className="h-1.5 w-full rounded-full bg-white/[0.1] overflow-hidden">
            <div
              style={{
                width: `${Math.min(progress, 100)}%`,
                backgroundColor: progress > 100 ? '#ef4444' : primary,
                transition: 'width 0.3s ease',
              }}
              className="h-full rounded-full"
            />
          </div>
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>{progress}%</span>
            {progress > 100 && <span className="text-red-400">Over estimate</span>}
          </div>
        </div>
      )}

      {showLogs && (
        <div className="space-y-2">
          {/* Add New Log */}
          {!showInput && (
            <button
              onClick={() => setShowInput(true)}
              style={{ borderColor: primary + '30', color: primary }}
              className="w-full flex items-center gap-2 p-2.5 rounded-lg border border-dashed hover:bg-white/[0.05] transition-colors text-sm font-medium"
            >
              <Plus size={16} />
              Log time
            </button>
          )}

          {/* Input Form */}
          {showInput && (
            <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.05] space-y-2">
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="text-xs text-slate-500 mb-1 block">Hours</label>
                  <input
                    type="number"
                    min="0"
                    value={hours}
                    onChange={(e) => setHours(Math.max(0, parseInt(e.target.value) || 0))}
                    placeholder="0"
                    className="w-full px-2 py-1.5 bg-white/5 border border-white/10 rounded text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-white/20"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-xs text-slate-500 mb-1 block">Minutes</label>
                  <input
                    type="number"
                    min="0"
                    max="59"
                    value={minutes}
                    onChange={(e) => setMinutes(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                    placeholder="0"
                    className="w-full px-2 py-1.5 bg-white/5 border border-white/10 rounded text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-white/20"
                  />
                </div>
              </div>

              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What did you work on? (optional)"
                className="w-full px-2 py-1.5 bg-white/5 border border-white/10 rounded text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-white/20"
              />

              <div className="flex gap-2">
                <button
                  onClick={handleAddLog}
                  disabled={isAdding || (hours === 0 && minutes === 0)}
                  style={{ backgroundColor: primary }}
                  className="flex-1 py-1.5 rounded text-white font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {isAdding ? 'Adding...' : 'Add'}
                </button>
                <button
                  onClick={() => {
                    setShowInput(false)
                    setHours(0)
                    setMinutes(0)
                    setDescription('')
                  }}
                  className="flex-1 py-1.5 rounded bg-white/5 text-slate-400 font-semibold text-sm hover:bg-white/10 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Time Logs List */}
          {timeLogs.length > 0 && (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {timeLogs.map((log) => {
                const logHours = Math.floor(log.duration_minutes / 60)
                const logMinutes = log.duration_minutes % 60
                const logDate = new Date(log.created_at)

                return (
                  <div
                    key={log.id}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.05] transition-colors group"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm text-white">
                          {logHours > 0 ? `${logHours}h ${logMinutes}m` : `${logMinutes}m`}
                        </span>
                        {log.profiles?.full_name && (
                          <span className="text-xs text-slate-500">by {log.profiles.full_name}</span>
                        )}
                      </div>
                      {log.description && (
                        <p className="text-xs text-slate-600 truncate mt-1">{log.description}</p>
                      )}
                      <p className="text-xs text-slate-700 mt-1">
                        {logDate.toLocaleDateString()} at{' '}
                        {logDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>

                    <button
                      onClick={() => handleDeleteLog(log.id, log.duration_minutes)}
                      className="flex-shrink-0 p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-400 text-slate-600 ml-2"
                      title="Delete time log"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )
              })}
            </div>
          )}

          {timeLogs.length === 0 && !showInput && (
            <p className="text-xs text-slate-600 text-center py-4">No time logs yet</p>
          )}
        </div>
      )}
    </div>
  )
}
