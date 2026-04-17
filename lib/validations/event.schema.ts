import { z } from 'zod'

export const eventSchema = z
  .object({
    workspace_id: z.string().uuid(),
    title: z.string().min(1).max(255),
    description: z.string().max(2000).optional(),
    start_at: z.string().datetime(),
    end_at: z.string().datetime(),
    type: z.enum(['task_due', 'reminder', 'meeting', 'milestone']),
    is_all_day: z.boolean().default(false),
    color: z
      .string()
      .regex(/^#[0-9A-F]{6}$/i)
      .optional(),
    linked_task_id: z.string().uuid().optional().nullable(),
  })
  .refine((data) => new Date(data.end_at) >= new Date(data.start_at), {
    message: 'end_at harus setelah start_at',
    path: ['end_at'],
  })

export type EventInput = z.infer<typeof eventSchema>
