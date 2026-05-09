'use client'

import { useToast } from '@/hooks/use-toast'
import { X } from 'lucide-react'
import { useEffect } from 'react'

export function Toaster() {
  const { toasts, dismiss } = useToast()

  // Auto dismiss after 5 seconds
  useEffect(() => {
    const timers = toasts.map((toast) => {
      if (toast.open) {
        return setTimeout(() => {
          dismiss(toast.id)
        }, 5000)
      }
    })

    return () => {
      timers.forEach((timer) => {
        if (timer) clearTimeout(timer)
      })
    }
  }, [toasts, dismiss])

  const handleDismiss = (toastId: string) => {
    dismiss(toastId)
  }

  return (
    <div className="fixed bottom-0 right-0 z-50 flex max-h-screen w-full flex-col-reverse p-4 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          onClick={() => handleDismiss(toast.id)}
          className={`pointer-events-auto mb-3 flex items-start gap-3 rounded-lg border backdrop-blur-sm px-4 py-3 shadow-lg transition-all duration-200 group cursor-pointer ${
            toast.variant === 'destructive'
              ? 'border-rose-500/30 bg-rose-500/10 text-rose-100 hover:bg-rose-500/15'
              : 'border-indigo-500/30 bg-indigo-500/10 text-indigo-100 hover:bg-indigo-500/15'
          } ${toast.open ? 'animate-in fade-in slide-in-from-bottom-2' : 'animate-out fade-out slide-out-to-bottom-2'}`}
        >
          <div className="flex-1 min-w-0">
            {toast.title && (
              <p className="font-semibold text-sm">{toast.title}</p>
            )}
            {toast.description && (
              <p className="text-xs opacity-90 mt-1">{toast.description}</p>
            )}
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation()
              handleDismiss(toast.id)
            }}
            className="flex-shrink-0 mt-0.5 p-1.5 rounded-md hover:bg-white/20 opacity-50 group-hover:opacity-100 transition-all cursor-pointer active:scale-95"
            type="button"
            aria-label="Dismiss notification"
            title="Close notification"
          >
            <X className="size-5" />
          </button>
        </div>
      ))}
    </div>
  )
}
