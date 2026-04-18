'use client'

import { usePathname } from 'next/navigation'
import { Search, Bell, ChevronDown } from 'lucide-react'
import { ThemeToggle } from '@/components/settings/ThemeToggle'

const PAGE_TITLES: Record<string, string> = {
  '/board': 'Board',
  '/calendar': 'Calendar',
  '/reminders': 'Reminders',
  '/settings': 'Settings',
  '/dashboard': 'Dashboard',
}

interface TopbarProps {
  user: {
    id: string
    email: string
    user_metadata: {
      full_name?: string
      avatar_url?: string
    }
  }
}

export function Topbar({ user }: TopbarProps) {
  const pathname = usePathname()
  const pageTitle = PAGE_TITLES[pathname] ?? 'TaskFlow'

  const initials = user.user_metadata?.full_name
    ? user.user_metadata.full_name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : user.email[0].toUpperCase()

  return (
    <header className="fixed top-0 left-56 right-0 h-14 z-20 bg-white/80 dark:bg-[#0F0F1A]/80 backdrop-blur-md border-b border-gray-200 dark:border-white/[0.05] flex items-center justify-between px-6">
      {/* Left Side */}
      <h1 className="font-display text-base font-semibold text-black dark:text-white">
        {pageTitle}
      </h1>

      {/* Right Side */}
      <div className="flex items-center gap-3">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-gray-400 dark:text-slate-600 pointer-events-none" />
          <input
            type="text"
            placeholder="Search..."
            className="bg-gray-100 dark:bg-[#1E1E35] border border-gray-300 dark:border-white/[0.08] hover:border-gray-400 dark:hover:border-white/[0.15] focus:border-indigo-500/40 focus:ring-1 focus:ring-indigo-500/20 rounded-lg pl-8 pr-3 py-1.5 text-sm text-black dark:text-white placeholder:text-gray-500 dark:placeholder:text-slate-600 outline-none w-48 transition-all duration-150"
          />
        </div>

        {/* Theme Toggle */}
        <ThemeToggle />

        {/* Bell Button */}
        <button className="p-2 rounded-lg text-gray-600 dark:text-slate-500 hover:text-gray-800 dark:hover:text-slate-300 hover:bg-gray-100 dark:hover:bg-white/[0.05] transition-all relative">
          <Bell className="size-4" />
          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-rose-500 rounded-full" />
        </button>

        {/* Avatar Button */}
        <button className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/[0.05] transition-all cursor-pointer">
          {user.user_metadata?.avatar_url ? (
            <img
              src={user.user_metadata.avatar_url}
              alt="Avatar"
              className="w-7 h-7 rounded-full object-cover"
            />
          ) : (
            <div className="w-7 h-7 rounded-full bg-indigo-500/30 flex items-center justify-center text-[10px] font-bold text-white dark:text-white">
              {initials}
            </div>
          )}
          <ChevronDown className="size-3 text-gray-400 dark:text-slate-600" />
        </button>
      </div>
    </header>
  )
}
