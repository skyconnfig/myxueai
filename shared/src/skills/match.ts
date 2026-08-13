import type { SkillDefinition, SkillKind, SkillMatchContext } from './schema.js'

function includesKeyword(text: string, keywords: string[]): boolean {
  const lower = text.toLowerCase()
  return keywords.some((kw) => lower.includes(kw.toLowerCase()))
}

function intersects(a: string[], b: string[]): boolean {
  const set = new Set(b.map((x) => x.toLowerCase()))
  return a.some((x) => set.has(x.toLowerCase()))
}

/** Evaluate whether a skill trigger matches the given context. */
export function matchSkillTrigger(skill: SkillDefinition, context: SkillMatchContext): boolean {
  const trigger = skill.trigger
  const mode = trigger.matchMode ?? 'any'
  const checks: boolean[] = []

  if (trigger.keywords?.length) {
    checks.push(Boolean(context.text && includesKeyword(context.text, trigger.keywords)))
  }
  if (trigger.tags?.length) {
    checks.push(Boolean(context.tags && intersects(context.tags, trigger.tags)))
  }
  if (trigger.kinds?.length) {
    checks.push(Boolean(context.kinds && intersects(context.kinds as string[], trigger.kinds as string[])))
  }

  if (checks.length === 0) return false
  return mode === 'all' ? checks.every(Boolean) : checks.some(Boolean)
}

/** Filter skills that match context, optionally by kind. */
export function filterMatchingSkills(
  skills: SkillDefinition[],
  context: SkillMatchContext,
  options: { kinds?: SkillKind[] } = {},
): SkillDefinition[] {
  let pool = skills
  if (options.kinds?.length) {
    const kindSet = new Set(options.kinds)
    pool = pool.filter((s) => kindSet.has(s.kind))
  }
  return pool.filter((s) => matchSkillTrigger(s, context))
}
