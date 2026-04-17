'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  LayoutDashboard,
  Kanban,
  CalendarDays,
  Bell,
  Settings,
  LogOut,
  ChevronUp,
} from 'lucide-react'

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Board', href: '/board', icon: Kanban },
  { label: 'Calendar', href: '/calendar', icon: CalendarDays },
  { label: 'Reminders', href: '/reminders', icon: Bell },
  { label: 'Settings', href: '/settings', icon: Settings },
]

interface SidebarProps {
  user: {
    id: string
    email: string
    user_metadata: {
      full_name?: string
      avatar_url?: string
    }
  }
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const displayName = user.user_metadata?.full_name || user.email
  const initials = user.user_metadata?.full_name
    ? user.user_metadata.full_name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : user.email[0].toUpperCase()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside className="fixed left-0 top-0 h-screen w-56 z-30 bg-[#0D0D1C] border-r border-white/[0.05] flex flex-col">
      {/* Top Section */}
      <div className="px-3 py-5">
        <div className="flex items-center gap-2 px-2 mb-6">
          <Kanban className="size-5 text-indigo-400" />
          <span className="font-display text-lg font-bold text-white">
            TaskFlow
          </span>
        </div>
      </div>

      {/* Nav Section */}
      <nav className="flex-1 px-2 space-y-0.5">
        {NAV_ITEMS.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + '/')
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg transition-all duration-150 w-full ${
                isActive
                  ? 'bg-indigo-500/15 text-indigo-300 border-r-2 border-indigo-500 font-medium'
                  : 'text-slate-500 hover:text-slate-300 hover:bg-white/[0.04]'
              }`}
            >
              <Icon className="size-4" />
              <span className="font-body">{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Bottom Section */}
      <div className="p-3 border-t border-white/[0.05]">
        <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/[0.04] cursor-pointer group">
          {user.user_metadata?.avatar_url ? (
            <img
              src={user.user_metadata.avatar_url}
              alt={displayName}
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-indigo-500/30 flex items-center justify-center text-xs font-bold text-white">
              {initials}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm text-slate-300 font-medium truncate">
              {displayName}
            </p>
            <p className="text-xs text-slate-600 truncate">{user.email}</p>
          </div>
          <ChevronUp className="size-3 text-slate-600" />
        </div>

        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-3 py-2 text-sm text-slate-600 hover:text-rose-400 hover:bg-rose-500/[0.08] rounded-lg transition-all duration-150 w-full mt-1"
        >
          <LogOut className="size-4" />
          <span>Sign out</span>
        </button>
      </div>
    </aside>
  )
}
