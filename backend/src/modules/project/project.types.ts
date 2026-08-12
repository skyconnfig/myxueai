import { z } from 'zod'

export const createProjectSchema = z.object({
  prompt: z.string().min(1, 'prompt is required'),
  ratio: z.enum(['9:16', '16:9', '1:1']).default('9:16'),
  duration: z.number().int().min(5).max(300).optional().default(30),
  style: z.string().optional(),
  name: z.string().optional(),
  audience: z.string().optional(),
  goal: z.string().optional(),
  videoStyle: z.string().optional(),
  emotion: z.string().optional(),
})

export const generateScriptSchema = z.object({
  projectId: z.string().min(1),
  prompt: z.string().min(1).optional(),
  style: z.string().optional(),
  duration: z.number().int().min(5).max(300).optional(),
  ratio: z.enum(['9:16', '16:9', '1:1']).optional(),
  audience: z.string().optional(),
  goal: z.string().optional(),
  videoStyle: z.string().optional(),
  skipCredits: z.boolean().optional(),
})

export const optimizeScriptSchema = z.object({
  projectId: z.string().min(1),
  sceneId: z.string().optional(),
  style: z.string().optional(),
})

export const changeStyleSchema = z.object({
  projectId: z.string().min(1),
  videoStyle: z.string().min(1),
})

export const updateSceneSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  visualPrompt: z.string().optional(),
  voiceText: z.string().optional(),
  voiceId: z.string().optional(),
  voiceEmotion: z.string().optional(),
  duration: z.number().int().min(1).max(120).optional(),
  imageUrl: z.string().url().optional().or(z.literal('')),
  imageSource: z.enum(['ai', 'manual']).optional(),
  storyBeat: z.string().optional(),
  shotType: z.string().optional(),
  cameraMotion: z.string().optional(),
  lighting: z.string().optional(),
  emotion: z.string().optional(),
  action: z.string().optional(),
  negativePrompt: z.string().optional(),
  transition: z.string().optional(),
  sceneType: z.string().optional(),
})

export const storyArcBeatSchema = z.object({
  type: z.enum(['pain', 'solution', 'result', 'cta']),
  duration: z.number().int().positive(),
  label: z.string().optional(),
  beat: z.string().optional(),
})

export const directorBriefSchema = z.object({
  video_style: z.string(),
  emotion: z.string(),
  audience: z.string().optional(),
  goal: z.string().optional(),
  story_arc: z.array(storyArcBeatSchema).min(1),
  negative_global: z.string().optional(),
})

export const cinematicSceneFieldsSchema = z.object({
  storyBeat: z.string().optional(),
  shotType: z.string().optional(),
  cameraMotion: z.string().optional(),
  lighting: z.string().optional(),
  emotion: z.string().optional(),
  action: z.string().optional(),
  negativePrompt: z.string().optional(),
  transition: z.string().optional(),
  sceneType: z.string().optional(),
  bgmIntensity: z.string().optional(),
})

export const uiStepSchema = z.object({
  at: z.number().min(0),
  action: z.enum(['move', 'click', 'navigate', 'dataChange', 'type']),
  target: z.string().optional(),
  value: z.union([z.string(), z.number()]).optional(),
  duration: z.number().optional(),
  x: z.number().min(0).max(1).optional(),
  y: z.number().min(0).max(1).optional(),
})

export const videoPlanSceneSchema = z.object({
  index: z.number().int().positive(),
  title: z.string().optional(),
  duration: z.number().int().positive(),
  description: z.string(),
  visual: z.string(),
  voice: z.string(),
  componentType: z.string().optional(),
  input: z.string().optional(),
  process: z.string().optional(),
  result: z.string().optional(),
  uiSteps: z.array(uiStepSchema).optional(),
}).merge(cinematicSceneFieldsSchema)

export const videoPlanSchema = z.object({
  title: z.string(),
  duration: z.number().int().positive(),
  style: z.string().optional(),
  directorBrief: directorBriefSchema.optional(),
  scenes: z.array(videoPlanSceneSchema).min(1),
})

export type CreateProjectInput = z.infer<typeof createProjectSchema>
export type GenerateScriptInput = z.infer<typeof generateScriptSchema>
export type OptimizeScriptInput = z.infer<typeof optimizeScriptSchema>
export type ChangeStyleInput = z.infer<typeof changeStyleSchema>
export type UpdateSceneInput = z.infer<typeof updateSceneSchema>
export type DirectorBrief = z.infer<typeof directorBriefSchema>
export type VideoPlan = z.infer<typeof videoPlanSchema>
export type VideoPlanScene = z.infer<typeof videoPlanSceneSchema>
