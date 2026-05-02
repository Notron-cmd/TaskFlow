import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getTasksWithAssignees } from '@/lib/queries/tasks'
import { StatCard } from '@/components/dashboard/StatCard'
import { RecentTasks } from '@/components/dashboard/RecentTasks'
import { DueToday } from '@/components/dashboard/DueToday'
import { ThisWeek } from '@/components/dashboard/ThisWeek'
import { HighPriority } from '@/components/dashboard/HighPriority'
import { TasksAnalytics } from '@/components/dashboard/TasksAnalytics'
import { LayoutDashboard, CheckCircle2, Clock, AlertCircle } from 'lucide-react'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: membership, error: membershipError } = await supabase
    .from('workspace_members')
    .select('workspace_id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (membershipError || !membership) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h1 className="font-display text-2xl font-bold text-black dark:text-white mb-2">
            No workspace found
          </h1>
          <p className="text-slate-500 text-sm">
            Please create or join a workspace to continue
          </p>
        </div>
      </div>
    )
  }

  // Fetch all tasks
  const tasks = await getTasksWithAssignees(membership.workspace_id)

  // Calculate stats
  const stats = {
    total: tasks.length,
    todo: tasks.filter(t => t.status === 'todo').length,
    inProgress: tasks.filter(t => t.status === 'in_progress').length,
    done: tasks.filter(t => t.status === 'done').length,
    overdue: tasks.filter(t => {
      if (t.status === 'done' || !t.due_date) return false
      return new Date(t.due_date) < new Date()
    }).length,
  }

  return (
    <div className="flex flex-col h-full animate-fade-in">
      {/* Header */}
      <div className="mb-6 md:mb-8 animate-slide-in-down">
        <div className="flex items-center gap-3">
          <LayoutDashboard className="w-6 h-6 md:w-8 md:h-8" style={{ color: 'var(--color-primary)' }} />
          <h1 className="font-display text-2xl md:text-3xl font-bold text-black dark:text-white">
            Dashboard
          </h1>
        </div>
        <p className="text-slate-600 dark:text-slate-400 text-sm mt-2">
          Welcome back! Here's your task overview.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4 mb-6 md:mb-8">
        <StatCard
          label="Total"
          value={stats.total}
          icon={<LayoutDashboard className="w-5 h-5" />}
          color="theme"
          delay={0}
        />
        <StatCard
          label="To Do"
          value={stats.todo}
          icon={<Clock className="w-5 h-5" />}
          color="slate"
          delay={50}
        />
        <StatCard
          label="In Progress"
          value={stats.inProgress}
          icon={<Clock className="w-5 h-5" />}
          color="amber"
          delay={100}
        />
        <StatCard
          label="Done"
          value={stats.done}
          icon={<CheckCircle2 className="w-5 h-5" />}
          color="teal"
          delay={150}
        />
        <StatCard
          label="Overdue"
          value={stats.overdue}
          icon={<AlertCircle className="w-5 h-5" />}
          color="rose"
          delay={200}
        />
      </div>

      {/* Main Content Grid */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-auto">
        {/* Left Column - Main Content */}
        <div className="lg:col-span-2 space-y-6 pb-6">
          <RecentTasks tasks={tasks} />
          <DueToday tasks={tasks} />
          <ThisWeek tasks={tasks} />
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-6 pb-6">
          <HighPriority tasks={tasks} />
          <TasksAnalytics stats={stats} />
        </div>
      </div>
    </div>
  )
}
