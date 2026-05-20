'use client'

import { useState, useEffect } from 'react'
import { Play, Pause, Square, RotateCcw, Clock } from 'lucide-react'
import { useTimer } from '@/hooks/useTimer'
import { useThemeColor } from '@/hooks/useThemeColor'

interface TimerWidgetProps {
  taskId: string
  onStop?: (minutes: number) => void
  compact?: boolean
}

export function TimerWidget({ taskId, onStop, compact = false }: TimerWidgetProps) {
  const { primary } = useThemeColor()
  const { elapsedSeconds, totalMinutes, isRunning, hasSession, start, pause, resume, stop, reset, formatTime } = useTimer(taskId)
  const [showSummary, setShowSummary] = useState(false)

  const handleStop = async () => {
    const minutes = await stop()
    onStop?.(minutes)
  }

  if (compact) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
        <Clock size={14} className="text-slate-400" />
        <span className="text-xs font-mono text-slate-300">
          {totalMinutes > 0 && (
            <>
              <span>{totalMinutes}m</span>
              {isRunning && <span className="ml-1 text-indigo-400">●</span>}
            </>
          )}
          {!hasSession && totalMinutes === 0 && <span className="text-slate-500">--</span>}
        </span>
      </div>
    )
  }

  return (
    <div className="p-4 rounded-lg bg-gradient-to-br from-slate-900/50 to-slate-950/50 border border-white/[0.08] space-y-3">
      {/* Timer Display */}
      <div className="text-center">
        <div className="text-4xl font-mono font-bold text-white mb-1">
          {formatTime(elapsedSeconds)}
        </div>
        <div className="text-xs text-slate-500">
          Total: <span className="text-slate-300">{totalMinutes}m</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex gap-2 justify-center">
        {!isRunning && !hasSession && (
          <button
            onClick={start}
            style={{ backgroundColor: primary }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-white font-semibold hover:opacity-90 transition-opacity"
          >
            <Play size={16} />
            Start
          </button>
        )}

        {!isRunning && hasSession && (
          <button
            onClick={resume}
            style={{ backgroundColor: primary }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-white font-semibold hover:opacity-90 transition-opacity"
          >
            <Play size={16} />
            Resume
          </button>
        )}

        {isRunning && (
          <button
            onClick={pause}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-500/10 text-orange-400 font-semibold hover:bg-orange-500/20 transition-colors border border-orange-500/30"
          >
            <Pause size={16} />
            Pause
          </button>
        )}

        {hasSession && (
          <button
            onClick={handleStop}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/10 text-red-400 font-semibold hover:bg-red-500/20 transition-colors border border-red-500/30"
          >
            <Square size={16} />
            Stop
          </button>
        )}

        {hasSession && (
          <button
            onClick={reset}
            className="p-2 rounded-lg hover:bg-white/5 transition-colors text-slate-400 hover:text-slate-300"
            title="Reset timer"
          >
            <RotateCcw size={16} />
          </button>
        )}
      </div>

      {/* Save Session Summary */}
      {!isRunning && hasSession && (
        <div className="pt-2 border-t border-white/[0.08]">
          <p className="text-xs text-slate-400 mb-2">
            Time tracked: <span className="text-slate-200 font-semibold">{formatTime(elapsedSeconds)}</span>
          </p>
          <button
            onClick={handleStop}
            style={{ backgroundColor: primary }}
            className="w-full py-2 rounded-lg text-white font-semibold text-sm hover:opacity-90 transition-opacity"
          >
            Save & Continue
          </button>
        </div>
      )}
    </div>
  )
}
