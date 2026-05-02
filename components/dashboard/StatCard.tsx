'use client'

import { useThemeColor } from '@/hooks/useThemeColor'

interface StatCardProps {
  label: string
  value: number
  icon: React.ReactNode
  color: 'indigo' | 'slate' | 'amber' | 'teal' | 'rose' | 'theme'
  delay: number
}

const colorClasses = {
  indigo: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/30',
  slate: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-500/30',
  amber: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30',
  teal: 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-200 dark:border-teal-500/30',
  rose: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30',
  theme: '',
}

export function StatCard({ label, value, icon, color, delay }: StatCardProps) {
  const { primary, secondary } = useThemeColor()
  
  if (color === 'theme') {
    return (
      <div
        className="border rounded-xl p-4 md:p-5 animate-scale-in"
        style={{
          animation: `scaleIn 0.4s ease-out ${delay}ms both`,
          backgroundColor: primary + '15',
          borderColor: primary + '50',
        }}
      >
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-xs md:text-sm font-medium opacity-75 mb-1">
              {label}
            </p>
            <p className="text-2xl md:text-3xl font-bold" style={{ color: primary }}>
              {value}
            </p>
          </div>
          <div className="opacity-50" style={{ color: primary }}>
            {icon}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className={`border rounded-xl p-4 md:p-5 ${colorClasses[color]} animate-scale-in`}
      style={{
        animation: `scaleIn 0.4s ease-out ${delay}ms both`,
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs md:text-sm font-medium opacity-75 mb-1">
            {label}
          </p>
          <p className="text-2xl md:text-3xl font-bold">
            {value}
          </p>
        </div>
        <div className="opacity-50">
          {icon}
        </div>
      </div>
    </div>
  )
}
