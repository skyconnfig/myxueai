import { z } from 'zod'

/** Agent Planner output — selects category, style, duration, and skill ids. */
export const agentPlanSchema = z.object({
  category: z.string().min(1),
  style: z.string().min(1),
  duration: z.number().int().positive(),
  skills: z.array(z.string()).min(1),
})

export type AgentPlan = z.infer<typeof agentPlanSchema>

/** Context passed into skill-aware director generation. */
export const skillDirectorContextSchema = z.object({
  plan: agentPlanSchema,
  skillIds: z.array(z.string()),
  promptFragment: z.string(),
  enforceRules: z.boolean().default(true),
})

export type SkillDirectorContext = z.infer<typeof skillDirectorContextSchema>
