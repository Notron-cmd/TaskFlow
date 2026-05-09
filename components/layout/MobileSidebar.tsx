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
  FileText,
} from 'lucide-react'
import { useMobileMenuStore } from '@/stores/mobileMenuStore'

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Board', href: '/board', icon: Kanban },
  { label: 'Calendar', href: '/calendar', icon: CalendarDays },
  { label: 'Notes', href: '/notes', icon: FileText },
  { label: 'Reminders', href: '/reminders', icon: Bell },
  { label: 'Settings', href: '/settings', icon: Settings },
]

interface MobileSidebarProps {
  user: {
    id: string
    email: string
    user_metadata: {
      full_name?: string
      avatar_url?: string
    }
  }
}

export function MobileSidebar({ user }: MobileSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const { closeMenu } = useMobileMenuStore()

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

  const handleNavClick = () => {
    closeMenu()
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-20 md:hidden animate-fade-in"
        onClick={closeMenu}
      />

      {/* Mobile Drawer */}
      <div className="fixed inset-y-0 left-0 w-64 z-30 bg-gray-50 dark:bg-[#0D0D1C] border-r border-gray-200 dark:border-white/[0.05] flex flex-col overflow-y-auto md:hidden animate-slide-in-left">
        {/* Top Section */}
        <div className="px-3 py-5 border-b border-gray-200 dark:border-white/[0.05]">
          <div className="flex items-center gap-2 px-2 mb-6">
            <Kanban className="size-5 text-indigo-400" />
            <span className="font-display text-lg font-bold text-black dark:text-white">
              TaskFlow
            </span>
          </div>

          {/* User Info */}
          <div className="flex items-center gap-3 px-2">
            {user.user_metadata?.avatar_url ? (
              <img
                src={user.user_metadata.avatar_url}
                alt="Avatar"
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-indigo-500/30 flex items-center justify-center text-xs font-bold text-white">
                {initials}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-black dark:text-white truncate">
                {displayName}
              </p>
              <p className="text-xs text-gray-600 dark:text-slate-400 truncate">
                {user.email}
              </p>
            </div>
          </div>
        </div>

        {/* Nav Section */}
        <nav className="flex-1 px-2 space-y-0.5 py-4">
          {NAV_ITEMS.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + '/')
            const Icon = item.icon

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={handleNavClick}
                className={`flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg transition-all duration-150 w-full ${
                  isActive
                    ? 'bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 font-medium'
                    : 'text-gray-700 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-white/[0.05]'
                }`}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* Bottom Section */}
        <div className="border-t border-gray-200 dark:border-white/[0.05] px-2 py-4">
          <button
            onClick={() => {
              handleNavClick()
              handleSignOut()
            }}
            className="flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg text-red-600 dark:text-red-400 hover:bg-red-500/10 w-full transition-all duration-150"
          >
            <LogOut size={18} />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </>
  )
}
