import {
  composeSkills,
  filterMatchingSkills,
  type ComposedSkillBundle,
  type SkillDefinition,
  type SkillKind,
  type SkillMatchContext,
  type SkillMergeStrategy,
} from '@xueai/shared'

export type { ComposedSkillBundle }

export interface ComposeOptions {
  mergeStrategy?: SkillMergeStrategy
  matchContext?: SkillMatchContext
  kinds?: SkillKind[]
  skillIds?: string[]
}

export class SkillComposer {
  /** Compose an explicit list of skills by id from registry. */
  composeByIds(
    registry: Map<string, SkillDefinition>,
    skillIds: string[],
    options: { mergeStrategy?: SkillMergeStrategy } = {},
  ): ComposedSkillBundle {
    const skills = skillIds
      .map((id) => registry.get(id))
      .filter((s): s is SkillDefinition => Boolean(s))
    return composeSkills(skills, options)
  }

  /** Match skills from pool then compose. */
  composeFromMatch(
    skills: SkillDefinition[],
    context: SkillMatchContext,
    options: ComposeOptions = {},
  ): ComposedSkillBundle {
    let matched = filterMatchingSkills(skills, context, { kinds: options.kinds })
    if (options.skillIds?.length) {
      const idSet = new Set(options.skillIds)
      matched = matched.filter((s) => idSet.has(s.id))
    }
    return composeSkills(matched, { mergeStrategy: options.mergeStrategy })
  }

  /** Compose all skills in pool (caller filters beforehand). */
  composeAll(
    skills: SkillDefinition[],
    options: { mergeStrategy?: SkillMergeStrategy } = {},
  ): ComposedSkillBundle {
    return composeSkills(skills, options)
  }
}

export const skillComposer = new SkillComposer()
