import type { SkillDefinition } from './skill.schema.js'
import type { SkillRouteContext } from './skill-context.js'
import type {
  LoadedSkillFile,
  SkillLoaderOptions,
  SkillMatchScore,
  SkillRegistry,
  SkillRouteOptions,
  SkillRouteResult,
} from './skill.types.js'

/** Skill Loader contract — load / persist skill documents from disk. */
export interface ISkillLoader {
  getDefaultRoot(): string
  getUserDir(): string
  loadFiles(options?: SkillLoaderOptions): Promise<LoadedSkillFile[]>
  load(options?: SkillLoaderOptions): Promise<SkillRegistry>
  getRegistry(): SkillRegistry | null
  loadOne(filePath: string): Promise<SkillDefinition>
  saveUserSkill(skill: SkillDefinition): Promise<string>
  deleteUserSkill(skillId: string): Promise<boolean>
}

/** Skill Router contract — match and resolve skill combinations. */
export interface ISkillRouter {
  route(
    skills: SkillDefinition[],
    context: SkillRouteContext,
    options?: SkillRouteOptions,
  ): SkillRouteResult

  resolveCategory(bundle?: SkillDefinition, fallback?: string): string

  /** Score all skills against context (for match API / debugging). */
  scoreSkills(skills: SkillDefinition[], context: SkillRouteContext): SkillMatchScore[]
}
