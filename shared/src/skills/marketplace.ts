import { z } from 'zod'
import { skillKindSchema } from './schema.js'

export const skillMarketplaceTierSchema = z.enum(['official', 'community', 'user'])

export type SkillMarketplaceTier = z.infer<typeof skillMarketplaceTierSchema>

/** Marketplace listing metadata — lives in skill.rules.marketplace. */
export const skillMarketplaceMetaSchema = z.object({
  tier: skillMarketplaceTierSchema.default('official'),
  category: z.string().optional(),
  featured: z.boolean().optional(),
  public: z.boolean().optional(),
  author: z.string().optional(),
  authorId: z.string().optional(),
  installs: z.number().int().nonnegative().optional(),
  tags: z.array(z.string()).optional(),
  summary: z.string().optional(),
  icon: z.string().optional(),
})

export type SkillMarketplaceMeta = z.infer<typeof skillMarketplaceMetaSchema>

export const skillMarketplaceListingSchema = z.object({
  id: z.string(),
  kind: skillKindSchema,
  name: z.string(),
  description: z.string(),
  version: z.string(),
  tier: skillMarketplaceTierSchema,
  category: z.string().optional(),
  featured: z.boolean(),
  public: z.boolean(),
  author: z.string().optional(),
  installs: z.number().int().nonnegative(),
  tags: z.array(z.string()),
  summary: z.string().optional(),
  origin: z.enum(['builtin', 'marketplace', 'user']),
})

export type SkillMarketplaceListing = z.infer<typeof skillMarketplaceListingSchema>
