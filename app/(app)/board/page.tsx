import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getTasksWithAssignees } from '@/lib/queries/tasks'
import { KanbanBoard } from '@/components/kanban/KanbanBoard'
import { BoardRealtimeProvider } from '@/components/kanban/BoardRealtimeProvider'
import { NewTaskButton } from '@/components/kanban/NewTaskButton'

export default async function BoardPage() {
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

  if (membershipError) {
    console.error('[BoardPage] Failed to load workspace membership', {
      userId: user.id,
      code: membershipError.code,
      message: membershipError.message,
      details: membershipError.details,
      hint: membershipError.hint,
    })
  }

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

  const tasks = await getTasksWithAssignees(membership.workspace_id)

  const taskCount = tasks.length

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <h1 className="font-display text-2xl font-bold text-white">
            My Board
          </h1>
          <span className="text-sm text-slate-500 ml-3">
            {taskCount} task{taskCount !== 1 ? 's' : ''}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {['All', 'Urgent', 'High', 'Mine'].map((filter) => (
            <button
              key={filter}
              className={`rounded-full px-3 py-1 text-xs border transition-all ${
                filter === 'All'
                  ? 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30'
                  : 'text-slate-400 border-white/[0.08] hover:text-slate-200 hover:bg-white/[0.05]'
              }`}
            >
              {filter}
            </button>
          ))}
          <div className="h-4 w-px bg-white/10 mx-1" />
          <NewTaskButton />
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <BoardRealtimeProvider workspaceId={membership.workspace_id}>
          <KanbanBoard
            initialTasks={tasks}
            workspaceId={membership.workspace_id}
          />
        </BoardRealtimeProvider>
      </div>
    </div>
  )
}
