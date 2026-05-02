'use client'

import { useEffect, useRef, useState } from 'react'
import { Bell, CheckCircle2, X, Clock } from 'lucide-react'
import { useNotificationCount } from '@/hooks/useNotificationCount'
import { useThemeColor } from '@/hooks/useThemeColor'
import { useToast } from '@/hooks/use-toast'

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const { count, reminders } = useNotificationCount()
  const { primary, accent } = useThemeColor()
  const { toast } = useToast()

  // Close panel when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        panelRef.current &&
        buttonRef.current &&
        !panelRef.current.contains(event.target as Node) &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const handleMarkAsRead = async (reminderId: string) => {
    try {
      // Mark as sent in the database
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()

      await supabase
        .from('reminders')
        .update({ sent: true, sent_at: new Date().toISOString() })
        .eq('id', reminderId)

      toast({
        title: 'Reminder marked as read',
        description: '',
      })
    } catch (error) {
      console.error('Error marking reminder as read:', error)
    }
  }

  return (
    <div className="relative">
      {/* Bell Button */}
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-lg text-gray-600 dark:text-slate-500 hover:text-gray-800 dark:hover:text-slate-300 transition-all relative"
        style={{
          backgroundColor: isOpen ? primary + '10' : 'transparent',
          color: isOpen ? primary : 'currentColor',
        }}
      >
        <Bell className="size-4" />
        {count > 0 && (
          <span 
            className="absolute -top-0.5 -right-0.5 h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
            style={{ backgroundColor: primary }}
          >
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      {/* Notification Panel */}
      {isOpen && (
        <div
          ref={panelRef}
          className="absolute right-0 top-full mt-2 w-96 bg-white dark:bg-[#1E1E35] border border-gray-200 dark:border-white/[0.08] rounded-xl shadow-lg z-50"
        >
          {/* Header */}
          <div className="border-b border-gray-200 dark:border-white/[0.08] px-4 py-3 flex items-center justify-between">
            <h3 className="font-semibold text-sm text-black dark:text-white">
              Notifications
            </h3>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-gray-100 dark:hover:bg-white/[0.05] rounded transition-colors"
            >
              <X className="size-4 text-gray-500 dark:text-slate-500" />
            </button>
          </div>

          {/* Content */}
          <div className="max-h-96 overflow-y-auto">
            {reminders.length === 0 ? (
              <div className="p-8 text-center">
                <Clock className="size-8 mx-auto mb-2 text-gray-300 dark:text-slate-700" />
                <p className="text-sm text-gray-500 dark:text-slate-400">
                  No pending reminders
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-white/[0.05]">
                {reminders.map((reminder) => (
                  <div
                    key={reminder.id}
                    className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-1 flex-shrink-0">
                        <div 
                          className="w-2 h-2 rounded-full animate-pulse"
                          style={{ backgroundColor: primary }}
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-black dark:text-white truncate">
                          {reminder.calendar_events?.title || 'Task Reminder'}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                          {formatTime(reminder.scheduled_at)}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">
                          {reminder.minutes_before}m before
                        </p>
                      </div>

                      <button
                        onClick={() => handleMarkAsRead(reminder.id)}
                        className="p-1 hover:bg-gray-200 dark:hover:bg-white/[0.1] rounded transition-colors flex-shrink-0"
                        title="Mark as read"
                      >
                        <CheckCircle2 className="size-4 text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {reminders.length > 0 && (
            <div className="border-t border-gray-200 dark:border-white/[0.08] px-4 py-3">
              <a
                href="/reminders"
                className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300"
              >
                View all reminders →
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
