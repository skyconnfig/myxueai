import { z } from 'zod'

export const createTaskSchema = z.object({
  projectId: z.string().min(1),
  type: z.enum(['PRODUCTION']).default('PRODUCTION'),
})

export type CreateTaskInput = z.infer<typeof createTaskSchema>
