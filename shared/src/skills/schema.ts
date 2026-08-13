import { z } from 'zod'

/** Skill category — extensible via enum; add new kinds in one place. */
export const skillKindSchema = z.enum([
  'bundle',
  'hook',
  'scene',
  'camera',
  'caption',
  'audio',
  'template',
  /** Visual / brand style — technology, cinematic, documentary, … */
  'style',
  /** Platform constraints — tiktok, youtube, xiaohongshu, … */
  'platform',
])

export type SkillKind = z.infer<typeof skillKindSchema>

export const SKILL_KINDS = skillKindSchema.options

/** How merged skills combine overlapping rule keys. */
export const skillMergeStrategySchema = z.enum(['override', 'deep-merge', 'append'])

export type SkillMergeStrategy = z.infer<typeof skillMergeStrategySchema>

/** Matching conditions — intentionally generic, no domain coupling. */
export const skillTriggerSchema = z
  .object({
    /** Match when input text contains any of these (case-insensitive). */
    keywords: z.array(z.string()).optional(),
    /** Match when context tags intersect. */
    tags: z.array(z.string()).optional(),
    /** Match when context declares one of these skill kinds. */
    kinds: z.array(skillKindSchema).optional(),
    /** Require all listed trigger fields vs any (default: any). */
    matchMode: z.enum(['all', 'any']).optional(),
  })
  .passthrough()

export type SkillTrigger = z.infer<typeof skillTriggerSchema>

/** Configurable parameter definition for skill instances. */
export const skillParameterSchema = z.object({
  type: z.enum(['string', 'number', 'boolean', 'array', 'object']),
  description: z.string().optional(),
  default: z.unknown().optional(),
  required: z.boolean().optional(),
  enum: z.array(z.union([z.string(), z.number(), z.boolean()])).optional(),
})

export type SkillParameter = z.infer<typeof skillParameterSchema>

export const skillExampleSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  input: z.record(z.unknown()).optional(),
  output: z.record(z.unknown()).optional(),
})

export type SkillExample = z.infer<typeof skillExampleSchema>

/** Director / scene rules — opaque payload, validated only as object. */
export const skillRulesSchema = z
  .object({
    priority: z.number().optional(),
    mergeStrategy: skillMergeStrategySchema.optional(),
  })
  .passthrough()

export type SkillRules = z.infer<typeof skillRulesSchema>

/** Component references — string list or structured map. */
export const skillComponentsSchema = z.union([
  z.array(z.string()),
  z.record(z.unknown()),
])

export type SkillComponents = z.infer<typeof skillComponentsSchema>

export const skillIdSchema = z
  .string()
  .min(1)
  .regex(/^[a-z0-9][a-z0-9._-]*$/i, 'skill id must be alphanumeric with .-_')

/** Full skill document — required fields per spec. */
export const skillDefinitionSchema = z.object({
  id: skillIdSchema,
  kind: skillKindSchema,
  name: z.string().min(1),
  description: z.string().min(1),
  version: z.string().default('1.0.0'),
  trigger: skillTriggerSchema,
  rules: skillRulesSchema,
  components: skillComponentsSchema,
  parameters: z.record(skillParameterSchema).default({}),
  examples: z.array(skillExampleSchema).min(1),
})

export type SkillDefinition = z.infer<typeof skillDefinitionSchema>

/** Result of loading + validating a single file. */
export const skillValidationResultSchema = z.object({
  ok: z.boolean(),
  skill: skillDefinitionSchema.optional(),
  errors: z.array(
    z.object({
      path: z.string(),
      message: z.string(),
    }),
  ),
  sourcePath: z.string().optional(),
})

export type SkillValidationResult = z.infer<typeof skillValidationResultSchema>

/** Output of composing multiple skills. */
export const composedSkillBundleSchema = z.object({
  skillIds: z.array(z.string()),
  kinds: z.array(skillKindSchema),
  rules: skillRulesSchema,
  components: skillComponentsSchema,
  parameters: z.record(skillParameterSchema),
  examples: z.array(skillExampleSchema),
})

export type ComposedSkillBundle = z.infer<typeof composedSkillBundleSchema>

/** Context for trigger matching — generic key bag. */
export const skillMatchContextSchema = z.object({
  text: z.string().optional(),
  tags: z.array(z.string()).optional(),
  kinds: z.array(skillKindSchema).optional(),
  params: z.record(z.unknown()).optional(),
})

export type SkillMatchContext = z.infer<typeof skillMatchContextSchema>
