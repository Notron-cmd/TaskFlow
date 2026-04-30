'use client'

import { usePathname } from 'next/navigation'
import { Search, ChevronDown, Menu, X } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { ThemeToggle } from '@/components/settings/ThemeToggle'
import { NotificationBell } from '@/components/layout/NotificationBell'
import { useMobileMenuStore } from '@/stores/mobileMenuStore'
import { MobileSidebar } from '@/components/layout/MobileSidebar'
import { useSearchStore } from '@/stores/searchStore'
import { searchTasks, getRecentItems } from '@/lib/actions/search'
import { SearchResults } from '@/components/search/SearchResults'

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
  const { isOpen, toggleMenu } = useMobileMenuStore()
  const { query, setQuery, setResults, setIsOpen, isOpen: isSearchOpen, clearSearch } = useSearchStore()
  const [isSearching, setIsSearching] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)

  const initials = user.user_metadata?.full_name
    ? user.user_metadata.full_name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : user.email[0].toUpperCase()

  // Handle search
  useEffect(() => {
    const handleSearch = async () => {
      if (!query.trim()) {
        setResults([])
        setIsOpen(false)
        return
      }

      setIsSearching(true)
      const results = await searchTasks(query)
      setResults(results)
      setIsOpen(true)
      setIsSearching(false)
    }

    const debounceTimer = setTimeout(handleSearch, 300)
    return () => clearTimeout(debounceTimer)
  }, [query, setResults, setIsOpen])

  // Handle click outside search
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const searchContainer = searchInputRef.current?.parentElement
      if (searchContainer && !searchContainer.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isSearchOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isSearchOpen, setIsOpen])

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        clearSearch()
        searchInputRef.current?.blur()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [clearSearch])

  return (
    <>
      <header className="fixed top-0 left-0 right-0 h-14 md:left-56 z-20 bg-white/80 dark:bg-[#0F0F1A]/80 backdrop-blur-md border-b border-gray-200 dark:border-white/[0.05] flex items-center justify-between px-4 md:px-6">
        {/* Left Side */}
        <div className="flex items-center gap-3">
          {/* Hamburger Menu - visible on mobile */}
          <button
            onClick={toggleMenu}
            className="md:hidden p-2 hover:bg-gray-100 dark:hover:bg-white/[0.05] rounded-lg transition-colors"
          >
            {isOpen ? (
              <X size={20} className="text-black dark:text-white" />
            ) : (
              <Menu size={20} className="text-black dark:text-white" />
            )}
          </button>

          <h1 className="font-display text-sm md:text-base font-semibold text-black dark:text-white">
            {pageTitle}
          </h1>
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-2 md:gap-3">
          {/* Search Bar - hidden on mobile, visible on md+ */}
          <div className="hidden md:block relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-gray-400 dark:text-slate-600 pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={async () => {
                if (!query.trim()) {
                  const recentItems = await getRecentItems()
                  setResults(recentItems)
                }
                setIsOpen(true)
              }}
              placeholder="Search tasks & events..."
              className="bg-gray-100 dark:bg-[#1E1E35] border border-gray-300 dark:border-white/[0.08] hover:border-gray-400 dark:hover:border-white/[0.15] focus:border-indigo-500/40 focus:ring-1 focus:ring-indigo-500/20 rounded-lg pl-8 pr-3 py-1.5 text-sm text-black dark:text-white placeholder:text-gray-500 dark:placeholder:text-slate-600 outline-none w-48 transition-all duration-150"
            />
            {isSearchOpen && <SearchResults isRecent={!query.trim()} />}
          </div>

          {/* Theme Toggle */}
          <ThemeToggle />

          {/* Notification Bell */}
          <NotificationBell />

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
            <ChevronDown className="hidden md:block size-3 text-gray-400 dark:text-slate-600" />
          </button>
        </div>
      </header>

      {/* Mobile Sidebar Drawer */}
      {isOpen && <MobileSidebar user={user} />}
    </>
  )
}
