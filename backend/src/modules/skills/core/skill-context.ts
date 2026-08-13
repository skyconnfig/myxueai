import type { SkillKind, SkillMatchContext } from './skill.schema.js'

/** Extended context for skill routing — maps to user video requirements. */
export interface SkillRouteContext extends SkillMatchContext {
  /** Inferred or explicit video category (product_demo, viral_short, …). */
  category?: string
  /** Visual style (technology, cinematic, documentary, …). */
  style?: string
  /** Target platform (tiktok, youtube, xiaohongshu, …). */
  platform?: string
  duration?: number
  audience?: string
  goal?: string
  ratio?: string
}

export interface BuildSkillRouteContextInput {
  topic: string
  category?: string
  style?: string
  videoStyle?: string
  platform?: string
  duration?: number
  audience?: string
  goal?: string
  ratio?: string
  tags?: string[]
  kinds?: SkillKind[]
}

/** Build a unified route context from user / project input. */
export function buildSkillRouteContext(input: BuildSkillRouteContextInput): SkillRouteContext {
  const style = input.style ?? input.videoStyle
  const textParts = [
    input.topic,
    input.goal,
    input.audience,
    style,
    input.platform,
    input.ratio,
  ].filter(Boolean)

  const tags = [...(input.tags ?? [])]
  if (input.category) tags.push(input.category)
  if (style) tags.push(style)
  if (input.platform) tags.push(input.platform)

  return {
    text: textParts.join(' '),
    tags: tags.length ? [...new Set(tags)] : undefined,
    kinds: input.kinds,
    category: input.category,
    style,
    platform: input.platform,
    duration: input.duration,
    audience: input.audience,
    goal: input.goal,
    ratio: input.ratio,
    params: {
      duration: input.duration,
      ratio: input.ratio,
    },
  }
}

/** Map category string to routing tags used by bundle triggers. */
export const CATEGORY_TAGS: Record<string, string[]> = {
  product_demo: ['product_demo', 'bundle', 'saas', 'demo'],
  tech_documentary: ['tech_documentary', 'documentary', 'tech'],
  viral_short: ['viral_short', 'bundle', 'short', 'douyin'],
  education: ['education', 'bundle', '科普'],
  advertisement: ['advertisement', 'bundle', 'commercial'],
  commercial: ['commercial', 'bundle'],
}

export function categoryToTags(category: string): string[] {
  return CATEGORY_TAGS[category] ?? [category]
}
