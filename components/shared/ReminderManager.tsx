'use client'

import { useState } from 'react'
import { Plus, Trash2, Clock } from 'lucide-react'

export interface ReminderConfig {
  minutesBefore: number
  channel: 'in_app' | 'email' | 'push'
}

interface ReminderManagerProps {
  reminders: ReminderConfig[]
  onAdd: (reminder: ReminderConfig) => void
  onRemove: (index: number) => void
}

const PRESET_MINUTES = [5, 10, 15, 30, 60, 1440] // 5min, 10min, 15min, 30min, 1hr, 1day

export function ReminderManager({
  reminders,
  onAdd,
  onRemove,
}: ReminderManagerProps) {
  const [minutesBefore, setMinutesBefore] = useState(15)
  const [channel, setChannel] = useState<'in_app' | 'email' | 'push'>('in_app')

  const handleAdd = () => {
    onAdd({ minutesBefore, channel })
    // Keep minute value but reset to in_app for next addition
    setChannel('in_app')
  }

  const formatMinutes = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`
    if (minutes < 1440) return `${Math.floor(minutes / 60)}h`
    return `${Math.floor(minutes / 1440)}d`
  }

  const getChannelLabel = (ch: string) => {
    switch (ch) {
      case 'in_app':
        return 'In App'
      case 'email':
        return 'Email'
      case 'push':
        return 'Push'
      default:
        return ch
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-white mb-3">
          Reminders
        </label>

        {/* Current reminders list */}
        {reminders.length > 0 && (
          <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
            {reminders.map((reminder, index) => (
              <div
                key={index}
                className="flex items-center justify-between bg-slate-700/50 rounded-lg p-3"
              >
                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-indigo-400" />
                  <span className="text-sm text-slate-200">
                    {formatMinutes(reminder.minutesBefore)} before via{' '}
                    <span className="font-medium text-indigo-300">
                      {getChannelLabel(reminder.channel)}
                    </span>
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => onRemove(index)}
                  className="p-1 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Add reminder form */}
        <div className="space-y-3 bg-slate-800/30 rounded-lg p-4 border border-slate-700">
          {/* Minutes preset buttons */}
          <div>
            <label className="text-xs text-slate-400 mb-2 block">
              Remind me before:
            </label>
            <div className="grid grid-cols-3 gap-2">
              {PRESET_MINUTES.map((minutes) => (
                <button
                  key={minutes}
                  type="button"
                  onClick={() => setMinutesBefore(minutes)}
                  className={`py-2 px-3 rounded text-sm font-medium transition-all ${
                    minutesBefore === minutes
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  {formatMinutes(minutes)}
                </button>
              ))}
            </div>
            {/* Custom input */}
            <div className="mt-2 flex items-center gap-2">
              <input
                type="number"
                min="1"
                max="10080"
                value={minutesBefore}
                onChange={(e) => setMinutesBefore(Math.max(1, parseInt(e.target.value) || 0))}
                className="flex-1 bg-slate-700 border border-slate-600 rounded px-3 py-2 text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                placeholder="Custom minutes"
              />
              <span className="text-xs text-slate-400">minutes</span>
            </div>
          </div>

          {/* Channel selection */}
          <div>
            <label className="text-xs text-slate-400 mb-2 block">
              Notification type:
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['in_app', 'email', 'push'] as const).map((ch) => (
                <button
                  key={ch}
                  type="button"
                  onClick={() => setChannel(ch)}
                  className={`py-2 px-3 rounded text-sm font-medium transition-all ${
                    channel === ch
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  {getChannelLabel(ch)}
                </button>
              ))}
            </div>
          </div>

          {/* Add button */}
          <button
            type="button"
            onClick={handleAdd}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add Reminder
          </button>
        </div>
      </div>
    </div>
  )
}
