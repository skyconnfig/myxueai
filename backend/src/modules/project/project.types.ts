import { z } from 'zod'

export const createProjectSchema = z.object({
  prompt: z.string().min(1, 'prompt is required'),
  ratio: z.enum(['9:16', '16:9', '1:1']).default('9:16'),
  duration: z.number().int().min(5).max(300).optional().default(30),
  style: z.string().optional(),
  name: z.string().optional(),
})

export const generateScriptSchema = z.object({
  projectId: z.string().min(1),
  prompt: z.string().min(1).optional(),
  style: z.string().optional(),
  duration: z.number().int().min(5).max(300).optional(),
  ratio: z.enum(['9:16', '16:9', '1:1']).optional(),
})

export const optimizeScriptSchema = z.object({
  projectId: z.string().min(1),
  sceneId: z.string().optional(),
  style: z.string().optional(),
})

export const updateSceneSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  visualPrompt: z.string().optional(),
  voiceText: z.string().optional(),
  duration: z.number().int().min(1).max(120).optional(),
  imageUrl: z.string().url().optional().or(z.literal('')),
})

export const videoPlanSceneSchema = z.object({
  index: z.number().int().positive(),
  title: z.string().optional(),
  duration: z.number().int().positive(),
  description: z.string(),
  visual: z.string(),
  voice: z.string(),
})

export const videoPlanSchema = z.object({
  title: z.string(),
  duration: z.number().int().positive(),
  style: z.string().optional(),
  scenes: z.array(videoPlanSceneSchema).min(1),
})

export type CreateProjectInput = z.infer<typeof createProjectSchema>
export type GenerateScriptInput = z.infer<typeof generateScriptSchema>
export type OptimizeScriptInput = z.infer<typeof optimizeScriptSchema>
export type UpdateSceneInput = z.infer<typeof updateSceneSchema>
export type VideoPlan = z.infer<typeof videoPlanSchema>
export type VideoPlanScene = z.infer<typeof videoPlanSceneSchema>
