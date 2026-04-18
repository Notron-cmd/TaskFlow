import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getEventsForMonth, getUpcomingEvents } from '@/lib/queries/events'
import { CalendarGrid } from '@/components/calendar/CalendarGrid'
import { UpcomingPanel } from '@/components/calendar/UpcomingPanel'

export default async function CalendarPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: membership } = await supabase
    .from('workspace_members')
    .select('workspace_id')
    .eq('user_id', user.id)
    .single()

  if (!membership) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h1 className="font-display text-2xl font-bold text-white mb-2">
            No workspace found
          </h1>
          <p className="text-slate-500 text-sm">
            Please create or join a workspace to continue
          </p>
        </div>
      </div>
    )
  }

  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()

  const events = await getEventsForMonth(membership.workspace_id, year, month)
  const upcomingEvents = await getUpcomingEvents(membership.workspace_id)

  return (
    <div className="flex flex-col md:flex-row gap-6 h-full overflow-hidden animate-fade-in">
      <div className="flex-1 overflow-auto animate-slide-in-left">
        <CalendarGrid
          initialEvents={events}
          year={year}
          month={month}
          workspaceId={membership.workspace_id}
        />
      </div>
      {/* UpcomingPanel - hidden on mobile, visible on md+ */}
      <div className="hidden md:block animate-slide-in-right">
        <UpcomingPanel events={upcomingEvents} />
      </div>
    </div>
  )
}
