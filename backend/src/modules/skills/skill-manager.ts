import {
  filterMatchingSkills,
  type ComposedSkillBundle,
  type SkillDefinition,
  type SkillKind,
  type SkillMatchContext,
  type SkillMergeStrategy,
} from '@xueai/shared'
import { skillComposer } from './skill-composer.js'
import { skillLoader } from './manager/skill-loader.js'
import type { SkillRegistry } from './core/skill.types.js'

export interface SkillManagerOptions {
  rootDir?: string
  strict?: boolean
  reload?: boolean
}

export class SkillManager {
  private registry: SkillRegistry | null = null

  async ensureLoaded(options: SkillManagerOptions = {}): Promise<SkillRegistry> {
    if (this.registry && !options.reload) return this.registry
    this.registry = await skillLoader.load({
      rootDir: options.rootDir,
      strict: options.strict ?? true,
      includeUserSkills: true,
    })
    return this.registry
  }

  async load(options: SkillManagerOptions = {}): Promise<SkillRegistry> {
    return this.ensureLoaded({ ...options, reload: true })
  }

  getRegistry(): SkillRegistry | null {
    return this.registry
  }

  listSkills(kind?: SkillKind): SkillDefinition[] {
    if (!this.registry) return []
    if (kind) return this.registry.byKind.get(kind) ?? []
    return this.registry.skills
  }

  listBundles(): SkillDefinition[] {
    return this.registry?.bundles ?? []
  }

  listUserSkills(): SkillDefinition[] {
    return this.registry?.userSkills ?? []
  }

  getSkill(id: string): SkillDefinition | undefined {
    return this.registry?.byId.get(id)
  }

  match(context: SkillMatchContext, kinds?: SkillKind[]): SkillDefinition[] {
    if (!this.registry) return []
    return filterMatchingSkills(this.registry.skills, context, { kinds })
  }

  compose(skillIds: string[], mergeStrategy?: SkillMergeStrategy): ComposedSkillBundle {
    if (!this.registry) {
      return {
        skillIds: [],
        kinds: [],
        rules: {},
        components: [],
        parameters: {},
        examples: [],
      }
    }
    const leafIds = skillIds.filter((id) => this.registry!.byId.get(id)?.kind !== 'bundle')
    return skillComposer.composeByIds(this.registry.byId, leafIds.length ? leafIds : skillIds, { mergeStrategy })
  }

  matchAndCompose(
    context: SkillMatchContext,
    options: { kinds?: SkillKind[]; mergeStrategy?: SkillMergeStrategy } = {},
  ): ComposedSkillBundle {
    if (!this.registry) {
      return {
        skillIds: [],
        kinds: [],
        rules: {},
        components: [],
        parameters: {},
        examples: [],
      }
    }
    return skillComposer.composeFromMatch(this.registry.skills, context, options)
  }
}

export const skillManager = new SkillManager()
