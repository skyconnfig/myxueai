import type {
  ComposedSkillBundle,
  SkillComponents,
  SkillDefinition,
  SkillExample,
  SkillMergeStrategy,
  SkillParameter,
  SkillRules,
} from './schema.js'

export interface ComposeSkillsOptions {
  /** Override merge strategy for the whole bundle. */
  mergeStrategy?: SkillMergeStrategy
}

function getPriority(skill: SkillDefinition): number {
  const p = skill.rules.priority
  return typeof p === 'number' ? p : 0
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function deepMerge(base: Record<string, unknown>, patch: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = { ...base }
  for (const [key, val] of Object.entries(patch)) {
    if (key === 'priority' || key === 'mergeStrategy') continue
    const existing = out[key]
    if (isPlainObject(existing) && isPlainObject(val)) {
      out[key] = deepMerge(existing, val)
    } else {
      out[key] = val
    }
  }
  return out
}

function mergeRules(sorted: SkillDefinition[], strategy: SkillMergeStrategy): SkillRules {
  let merged: SkillRules = {}
  for (const skill of sorted) {
    const { priority: _p, mergeStrategy: _m, ...payload } = skill.rules
    if (strategy === 'override') {
      merged = { ...merged, ...payload, ...(skill.rules.priority != null ? { priority: skill.rules.priority } : {}) }
    } else if (strategy === 'append') {
      for (const [k, v] of Object.entries(payload)) {
        const cur = merged[k]
        if (Array.isArray(cur) && Array.isArray(v)) {
          merged[k] = [...cur, ...v]
        } else {
          merged[k] = v
        }
      }
    } else {
      merged = deepMerge(merged, payload) as SkillRules
    }
  }
  const topPriority = sorted.reduce((max, s) => Math.max(max, getPriority(s)), 0)
  if (topPriority > 0) merged.priority = topPriority
  merged.mergeStrategy = strategy
  return merged
}

function mergeComponents(sorted: SkillDefinition[], strategy: SkillMergeStrategy): SkillComponents {
  const arrays: string[][] = []
  const objects: Record<string, unknown>[] = []

  for (const skill of sorted) {
    if (Array.isArray(skill.components)) arrays.push(skill.components)
    else objects.push(skill.components)
  }

  if (objects.length === 0) {
    const flat = arrays.flat()
    return strategy === 'override' ? (arrays.at(-1) ?? []) : [...new Set(flat)]
  }

  if (arrays.length === 0) {
    return objects.reduce(
      (acc, obj) => (strategy === 'deep-merge' ? deepMerge(acc, obj) : { ...acc, ...obj }),
      {} as Record<string, unknown>,
    )
  }

  return {
    list: strategy === 'override' ? (arrays.at(-1) ?? []) : [...new Set(arrays.flat())],
    map: objects.reduce(
      (acc, obj) => (strategy === 'deep-merge' ? deepMerge(acc, obj) : { ...acc, ...obj }),
      {} as Record<string, unknown>,
    ),
  }
}

function mergeParameters(sorted: SkillDefinition[]): Record<string, SkillParameter> {
  const out: Record<string, SkillParameter> = {}
  for (const skill of sorted) {
    Object.assign(out, skill.parameters)
  }
  return out
}

function collectExamples(sorted: SkillDefinition[]): SkillExample[] {
  return sorted.flatMap((s) =>
    s.examples.map((ex) => ({
      ...ex,
      name: `${s.id}:${ex.name}`,
      description: ex.description ?? `from skill ${s.id}`,
    })),
  )
}

/**
 * Combine multiple skills into one bundle.
 * Skills are sorted by rules.priority (ascending); later/higher priority wins on override.
 */
export function composeSkills(
  skills: SkillDefinition[],
  options: ComposeSkillsOptions = {},
): ComposedSkillBundle {
  if (skills.length === 0) {
    return {
      skillIds: [],
      kinds: [],
      rules: { mergeStrategy: options.mergeStrategy ?? 'deep-merge' },
      components: [],
      parameters: {},
      examples: [],
    }
  }

  const sorted = [...skills].sort((a, b) => getPriority(a) - getPriority(b))
  const strategy =
    options.mergeStrategy ??
    (sorted.at(-1)?.rules.mergeStrategy as SkillMergeStrategy | undefined) ??
    'deep-merge'

  return {
    skillIds: sorted.map((s) => s.id),
    kinds: [...new Set(sorted.map((s) => s.kind))],
    rules: mergeRules(sorted, strategy),
    components: mergeComponents(sorted, strategy),
    parameters: mergeParameters(sorted),
    examples: collectExamples(sorted),
  }
}
