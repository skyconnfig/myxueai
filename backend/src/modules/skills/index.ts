export * from './core/index.js'
export * from './manager/index.js'

export { SkillLoader, skillLoader } from './manager/skill-loader.js'
export type { SkillRegistry, LoadedSkillFile, SkillLoaderOptions } from './core/skill.types.js'

export {
  validateSkillDocument,
  validateSkillDocuments,
  isValidSkill,
  type SkillValidationResult,
} from './skill-validator.js'
export { SkillComposer, skillComposer, type ComposedSkillBundle } from './skill-composer.js'
export { SkillRouter, skillRouter, scoreSkillMatch } from './manager/skill-router.js'
export type { SkillRouteResult, SkillRouteOptions, SkillMatchScore } from './core/skill.types.js'
export { SkillManager, skillManager } from './skill-manager.js'
export { AgentPlanner, agentPlanner } from './agent-planner.js'
export { buildSkillPromptFragment } from './skill-prompt.js'
export { enforceSkillRules } from './skill-enforcer.js'
export { SkillUploadService, skillUploadService } from './skill-upload.service.js'
export { SkillPackageService, skillPackageService } from './skill-package.service.js'
export { skillMarketplaceService, SkillMarketplaceService } from './marketplace/index.js'
export { default as skillsRoutes } from './skills.routes.js'
