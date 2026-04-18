'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

/**
 * Debug component untuk lihat reminders di database
 * Add ke halaman settings atau anywhere untuk debugging
 */
export function RemindersDebugPanel() {
  const [reminders, setReminders] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const checkReminders = async () => {
      setLoading(true)
      try {
        const supabase = createClient()

        // Get user
        const {
          data: { user: currentUser },
        } = await supabase.auth.getUser()

        if (!currentUser) {
          console.log('No user')
          setLoading(false)
          return
        }

        setUser(currentUser)

        // Fetch ALL reminders for this user (tidak filter sent/scheduled)
        const { data, error } = await supabase
          .from('reminders')
          .select(
            `
            id,
            scheduled_at,
            channel,
            sent,
            sent_at,
            created_at,
            minutes_before,
            calendar_events(id, title)
          `
          )
          .eq('user_id', currentUser.id)
          .order('scheduled_at', { ascending: false })

        if (error) {
          console.error('Error fetching:', error)
          setLoading(false)
          return
        }

        console.log('All user reminders:', data)
        setReminders(data || [])
      } catch (error) {
        console.error('Error:', error)
      }
      setLoading(false)
    }

    checkReminders()

    // Re-check setiap 5 detik
    const interval = setInterval(checkReminders, 5000)
    return () => clearInterval(interval)
  }, [])

  if (loading) return <div className="p-4 text-slate-400">Loading...</div>

  return (
    <div className="p-4 bg-slate-900 rounded-lg border border-slate-700 text-xs text-slate-300 max-w-4xl">
      <h3 className="text-sm font-bold text-white mb-3">🐛 Reminders Debug Panel</h3>

      {user && (
        <div className="mb-3 pb-3 border-b border-slate-700">
          <p className="text-slate-400">User ID: <code className="text-indigo-300">{user.id}</code></p>
          <p className="text-slate-400">Email: <code className="text-indigo-300">{user.email}</code></p>
          <p className="text-slate-400">Now: <code className="text-indigo-300">{new Date().toISOString()}</code></p>
        </div>
      )}

      <div className="space-y-2">
        {reminders.length === 0 ? (
          <p className="text-slate-500">No reminders found</p>
        ) : (
          reminders.map((reminder: any) => {
            const now = new Date()
            const scheduled = new Date(reminder.scheduled_at)
            const isPast = scheduled < now
            const isInApp = reminder.channel === 'in_app'
            const isSent = reminder.sent === true

            return (
              <div
                key={reminder.id}
                className={`p-2 rounded border ${
                  isPast && isInApp && !isSent
                    ? 'bg-green-500/10 border-green-500/30' // Should trigger
                    : 'bg-slate-800/50 border-slate-700/50'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="font-mono">
                      <span className="text-slate-400">Task: </span>
                      <span className="text-white">{reminder.calendar_events?.title}</span>
                    </p>
                    <p>
                      <span className="text-slate-400">Channel: </span>
                      <span
                        className={`font-mono ${
                          isInApp ? 'text-amber-300' : 'text-slate-400'
                        }`}
                      >
                        {reminder.channel}
                      </span>
                    </p>
                    <p>
                      <span className="text-slate-400">Scheduled: </span>
                      <code className="text-sky-300">{reminder.scheduled_at}</code>
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      {isPast ? (
                        <span className="text-green-400">✅ Time passed</span>
                      ) : (
                        <span className="text-yellow-400">⏳ Waiting ({Math.round((scheduled.getTime() - now.getTime()) / 1000)}s)</span>
                      )}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className={`text-xs font-mono px-2 py-1 rounded ${isSent ? 'bg-green-500/20 text-green-300' : 'bg-slate-700/50 text-slate-400'}`}>
                      {isSent ? '✓ Sent' : 'Pending'}
                    </div>
                    {isPast && isInApp && !isSent && (
                      <div className="text-green-400 text-xs font-bold mt-1">
                        🔴 SHOULD TOAST!
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      <p className="text-xs text-slate-500 mt-4 p-2 bg-slate-800/50 rounded">
        💡 Green status = reminder should have shown a toast. If not showing, check browser console for errors.
      </p>
    </div>
  )
}
