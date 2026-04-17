'use client'

import TaskCard from '@/components/kanban/TaskCard'
import TaskCardSkeleton from '@/components/kanban/TaskCardSkeleton'

const SAMPLE_TASKS = [
  {
    id: '1',
    title: 'Redesign onboarding flow for mobile',
    description:
      'Update the onboarding screens based on user feedback from Q3 testing sessions.',
    status: 'in_progress' as const,
    priority: 'urgent' as const,
    due_date: new Date(Date.now() + 86400000).toISOString(),
    tags: ['design', 'mobile'],
    attachment_count: 3,
    comment_count: 5,
    position: 0,
    workspace_id: 'demo',
    created_by: 'user1',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    calendar_event_id: 'event1',
    task_assignees: [
      {
        profiles: {
          id: 'u1',
          full_name: 'Rezie Andriano',
          avatar_url: null,
        },
      },
      {
        profiles: {
          id: 'u2',
          full_name: 'John Doe',
          avatar_url: null,
        },
      },
    ],
    calendar_events: {
      id: 'event1',
      start_at: new Date().toISOString(),
      type: 'task_due',
    },
  },
  {
    id: '2',
    title: 'Fix authentication bug on Safari',
    description: null,
    status: 'todo' as const,
    priority: 'high' as const,
    due_date: new Date(Date.now() - 86400000).toISOString(),
    tags: [],
    attachment_count: 0,
    comment_count: 2,
    position: 1,
    workspace_id: 'demo',
    created_by: 'user1',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    calendar_event_id: null,
    task_assignees: [
      {
        profiles: {
          id: 'u1',
          full_name: 'Rezie Andriano',
          avatar_url: null,
        },
      },
    ],
    calendar_events: null,
  },
  {
    id: '3',
    title: 'Write API documentation for v2 endpoints',
    description:
      'Document all new endpoints introduced in the v2 release including auth, tasks, and calendar.',
    status: 'todo' as const,
    priority: 'medium' as const,
    due_date: new Date(Date.now() + 7 * 86400000).toISOString(),
    tags: ['docs', 'api', 'v2', 'backend', 'priority'],
    attachment_count: 1,
    comment_count: 0,
    position: 2,
    workspace_id: 'demo',
    created_by: 'user1',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    calendar_event_id: null,
    task_assignees: [
      {
        profiles: {
          id: 'u1',
          full_name: 'Rezie Andriano',
          avatar_url: null,
        },
      },
      {
        profiles: {
          id: 'u2',
          full_name: 'John Doe',
          avatar_url: null,
        },
      },
      {
        profiles: {
          id: 'u3',
          full_name: 'Jane Smith',
          avatar_url: null,
        },
      },
      {
        profiles: {
          id: 'u4',
          full_name: 'Bob Wilson',
          avatar_url: null,
        },
      },
    ],
    calendar_events: null,
  },
  {
    id: '4',
    title: 'Research competitor pricing models',
    description: null,
    status: 'todo' as const,
    priority: 'low' as const,
    due_date: null,
    tags: ['research'],
    attachment_count: 0,
    comment_count: 1,
    position: 3,
    workspace_id: 'demo',
    created_by: 'user1',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    calendar_event_id: null,
    task_assignees: [],
    calendar_events: null,
  },
  {
    id: '5',
    title: 'Set up CI/CD pipeline for staging environment',
    description:
      'Configure GitHub Actions workflow for automated testing and deployment.',
    status: 'done' as const,
    priority: 'high' as const,
    due_date: new Date(Date.now() - 2 * 86400000).toISOString(),
    tags: ['devops', 'ci/cd'],
    attachment_count: 2,
    comment_count: 8,
    position: 4,
    workspace_id: 'demo',
    created_by: 'user1',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    calendar_event_id: null,
    task_assignees: [
      {
        profiles: {
          id: 'u1',
          full_name: 'Rezie Andriano',
          avatar_url: null,
        },
      },
      {
        profiles: {
          id: 'u2',
          full_name: 'John Doe',
          avatar_url: null,
        },
      },
    ],
    calendar_events: null,
  },
]

export default function TaskCardDemo() {
  return (
    <div className="bg-[#0F0F1A] min-h-screen p-8">
      <h1 className="font-display text-xl font-bold text-white mb-6">
        TaskCard Component Demo
      </h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {SAMPLE_TASKS.map((task) => (
          <TaskCard key={task.id} task={task} />
        ))}
        <TaskCardSkeleton />
        <TaskCardSkeleton />
      </div>
    </div>
  )
}
