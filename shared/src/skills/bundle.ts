import type { SkillDefinition } from './schema.js'

/** Expand bundle skills into concrete skill id list. */
export function expandBundleSkills(
  skills: SkillDefinition[],
  bundle: SkillDefinition,
): string[] {
  const includes = bundle.rules.includes as string[] | undefined
  if (!Array.isArray(includes) || includes.length === 0) return [bundle.id]

  const idSet = new Set<string>(includes)
  for (const id of includes) {
    const child = skills.find((s) => s.id === id)
    if (child?.kind === 'bundle') {
      for (const nested of expandBundleSkills(skills, child)) {
        idSet.add(nested)
      }
    }
  }
  return [...idSet]
}

export function listBundleSkills(skills: SkillDefinition[]): SkillDefinition[] {
  return skills.filter((s) => s.kind === 'bundle')
}

export function getBundleCategory(bundle: SkillDefinition): string | undefined {
  const cat = bundle.rules.category
  return typeof cat === 'string' ? cat : undefined
}
