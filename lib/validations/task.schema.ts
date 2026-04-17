import { z } from 'zod'

export const taskSchema = z.object({
  workspace_id: z.string().uuid(),
  title: z.string().min(1, 'Title wajib diisi').max(255),
  description: z.string().max(5000).optional(),
  status: z.enum(['todo', 'in_progress', 'done']).default('todo'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  due_date: z.string().datetime().optional().nullable(),
  tags: z.array(z.string()).default([]),
  position: z.number().int().min(0).default(0),
})

export const moveTaskSchema = z.object({
  task_id: z.string().uuid(),
  new_status: z.enum(['todo', 'in_progress', 'done']),
  new_position: z.number().int().min(0),
})

export type TaskInput = z.infer<typeof taskSchema>
export type MoveTaskInput = z.infer<typeof moveTaskSchema>
