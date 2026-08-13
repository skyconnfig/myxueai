import {
  expandBundleSkills,
  getBundleCategory,
  listBundleSkills,
  matchSkillTrigger,
  type SkillDefinition,
  type SkillKind,
} from '@xueai/shared'
import type { ISkillRouter } from '../core/skill.interface.js'
import type { SkillRouteContext } from '../core/skill-context.js'
import type {
  SkillMatchScore,
  SkillRouteOptions,
  SkillRouteResult,
} from '../core/skill.types.js'

const KEYWORD_SCORE = 10
const TAG_SCORE = 20
const KIND_SCORE = 15
const TAXONOMY_SCORE = 25

function getPriority(skill: SkillDefinition): number {
  return Number(skill.rules.priority) || 0
}

function includesKeyword(text: string, keywords: string[]): string[] {
  const lower = text.toLowerCase()
  return keywords.filter((kw) => lower.includes(kw.toLowerCase()))
}

function intersectTags(contextTags: string[], triggerTags: string[]): string[] {
  const set = new Set(triggerTags.map((x) => x.toLowerCase()))
  return contextTags.filter((x) => set.has(x.toLowerCase()))
}

function getTaxonomy(skill: SkillDefinition): Record<string, string> | undefined {
  const tax = skill.rules.taxonomy as Record<string, string> | undefined
  return tax && typeof tax === 'object' ? tax : undefined
}

function taxonomyMatches(skill: SkillDefinition, context: SkillRouteContext): boolean {
  const tax = getTaxonomy(skill)
  if (!tax) return false
  if (tax.category && context.category && tax.category === context.category) return true
  if (tax.style && context.style && tax.style === context.style) return true
  if (tax.platform && context.platform && tax.platform === context.platform) return true
  return false
}

/** Compute match score for a single skill against route context. */
export function scoreSkillMatch(skill: SkillDefinition, context: SkillRouteContext): SkillMatchScore {
  const matchedBy: SkillMatchScore['matchedBy'] = []
  let score = getPriority(skill)

  const text = context.text ?? ''
  const trigger = skill.trigger

  if (trigger.keywords?.length && text) {
    const hits = includesKeyword(text, trigger.keywords)
    if (hits.length) {
      score += hits.length * KEYWORD_SCORE
      matchedBy.push('keyword')
    }
  }

  if (trigger.tags?.length && context.tags?.length) {
    const hits = intersectTags(context.tags, trigger.tags)
    if (hits.length) {
      score += hits.length * TAG_SCORE
      matchedBy.push('tag')
    }
  }

  if (trigger.kinds?.length && context.kinds?.length) {
    const kindSet = new Set(context.kinds)
    if (trigger.kinds.some((k) => kindSet.has(k))) {
      score += KIND_SCORE
      matchedBy.push('kind')
    }
  }

  if (taxonomyMatches(skill, context)) {
    score += TAXONOMY_SCORE
    if (!matchedBy.includes('tag')) matchedBy.push('tag')
  }

  // Zero score with no trigger hit → not a match (unless only priority)
  const triggersDefined =
    Boolean(trigger.keywords?.length) ||
    Boolean(trigger.tags?.length) ||
    Boolean(trigger.kinds?.length) ||
    Boolean(getTaxonomy(skill))

  const isMatch = matchedBy.length > 0 || (triggersDefined && matchSkillTrigger(skill, context))

  if (!isMatch) {
    return { skillId: skill.id, score: 0, kind: skill.kind, matchedBy: [] }
  }

  if (matchedBy.length === 0 && matchSkillTrigger(skill, context)) {
    score += 5
    matchedBy.push('keyword')
  }

  return { skillId: skill.id, score, kind: skill.kind, matchedBy }
}

function sortByScoreThenPriority(
  skills: SkillDefinition[],
  scores: Map<string, number>,
): SkillDefinition[] {
  return [...skills].sort((a, b) => {
    const scoreDiff = (scores.get(b.id) ?? 0) - (scores.get(a.id) ?? 0)
    if (scoreDiff !== 0) return scoreDiff
    return getPriority(b) - getPriority(a)
  })
}

/**
 * Route user context to skills — bundle-first, multi-skill combo, priority + score sort.
 * Conflict resolution for overlapping rules happens in Skill Composer (deep-merge).
 */
export class SkillRouter implements ISkillRouter {
  scoreSkills(skills: SkillDefinition[], context: SkillRouteContext): SkillMatchScore[] {
    return skills
      .map((s) => scoreSkillMatch(s, context))
      .filter((s) => s.score > 0)
      .sort((a, b) => b.score - a.score)
  }

  route(
    skills: SkillDefinition[],
    context: SkillRouteContext,
    options: SkillRouteOptions = {},
  ): SkillRouteResult {
    let pool = skills
    if (options.kinds?.length) {
      const kindSet = new Set(options.kinds)
      pool = pool.filter((s) => kindSet.has(s.kind))
    }

    const allScores = pool.map((s) => scoreSkillMatch(s, context))
    const scoreMap = new Map(allScores.map((s) => [s.skillId, s.score]))
    const positiveScores = allScores.filter((s) => s.score > 0)

    const bundles = listBundleSkills(pool)
    const matchedBundles = sortByScoreThenPriority(
      bundles.filter((b: SkillDefinition) => (scoreMap.get(b.id) ?? 0) > 0 || matchSkillTrigger(b, context)),
      scoreMap,
    )

    const bundle = matchedBundles[0]
    let resolvedSkillIds: string[] = []

    if (bundle) {
      resolvedSkillIds = expandBundleSkills(skills, bundle)
    }

    const nonBundle = pool.filter((s) => s.kind !== 'bundle')
    let matched = nonBundle.filter((s) => (scoreMap.get(s.id) ?? 0) > 0 || matchSkillTrigger(s, context))
    matched = sortByScoreThenPriority(matched, scoreMap)

    if (options.dedupeByKind) {
      const byKind = new Map<SkillKind, SkillDefinition>()
      for (const skill of matched) {
        if (!byKind.has(skill.kind)) byKind.set(skill.kind, skill)
      }
      matched = [...byKind.values()].sort(
        (a, b) => (scoreMap.get(b.id) ?? 0) - (scoreMap.get(a.id) ?? 0),
      )
    }

    if (options.limit != null && options.limit > 0) {
      matched = matched.slice(0, options.limit)
    }

    if (resolvedSkillIds.length === 0) {
      resolvedSkillIds = matched.map((s) => s.id)
    } else {
      for (const s of matched) {
        if (!resolvedSkillIds.includes(s.id)) resolvedSkillIds.push(s.id)
      }
    }

    if (options.forceSkillIds?.length) {
      for (const id of options.forceSkillIds) {
        if (skills.some((s) => s.id === id) && !resolvedSkillIds.includes(id)) {
          resolvedSkillIds.push(id)
          positiveScores.push({
            skillId: id,
            score: 1000,
            kind: skills.find((s) => s.id === id)!.kind,
            matchedBy: ['forced'],
          })
        }
      }
    }

    // Sort resolved ids by score for stable compose priority
    resolvedSkillIds.sort(
      (a, b) => (scoreMap.get(b) ?? 0) - (scoreMap.get(a) ?? 0),
    )

    const byKind: Record<string, SkillDefinition[]> = {}
    for (const skill of [...matched, ...(bundle ? [bundle] : [])]) {
      byKind[skill.kind] ??= []
      byKind[skill.kind].push(skill)
    }

    return {
      matched,
      byKind,
      bundle,
      resolvedSkillIds,
      scores: positiveScores.sort((a, b) => b.score - a.score),
    }
  }

  resolveCategory(bundle?: SkillDefinition, fallback?: string): string {
    if (bundle) {
      return getBundleCategory(bundle) ?? fallback ?? 'commercial'
    }
    return fallback ?? 'commercial'
  }
}

export const skillRouter = new SkillRouter()
