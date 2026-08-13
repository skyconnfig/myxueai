import type { SkillDefinition, SkillKind, SkillValidationResult } from './skill.schema.js'

/** Where a skill file was loaded from. */
export type SkillOrigin = 'builtin' | 'user'

/** Raw file before validation. */
export interface LoadedSkillFile {
  sourcePath: string
  relativePath: string
  raw: unknown
  origin: SkillOrigin
}

/** In-memory skill registry after load. */
export interface SkillRegistry {
  rootDir: string
  userDir: string
  skills: SkillDefinition[]
  byId: Map<string, SkillDefinition>
  byKind: Map<SkillKind, SkillDefinition[]>
  bundles: SkillDefinition[]
  userSkills: SkillDefinition[]
  loadResults: SkillValidationResult[]
}

export interface SkillLoaderOptions {
  rootDir?: string
  /** Throw on first invalid skill file. */
  strict?: boolean
  /** Include user-uploaded skills from storage. */
  includeUserSkills?: boolean
}

/** Router options — control matching breadth and dedup. */
export interface SkillRouteOptions {
  kinds?: SkillKind[]
  /** Max atomic (non-bundle) skills to attach beyond bundle includes. */
  limit?: number
  /** When true, keep at most one matched skill per kind (highest score). */
  dedupeByKind?: boolean
  /** Explicit skill ids to force-include (user uploads). */
  forceSkillIds?: string[]
}

/** Result of routing user context to skills. */
export interface SkillRouteResult {
  matched: SkillDefinition[]
  byKind: Record<string, SkillDefinition[]>
  /** Highest-scoring matching bundle, if any. */
  bundle?: SkillDefinition
  /** Expanded skill ids: bundle.includes + matched atomics + forced ids. */
  resolvedSkillIds: string[]
  /** Per-skill match scores (for debugging / API). */
  scores: SkillMatchScore[]
}

/** Scored match entry. */
export interface SkillMatchScore {
  skillId: string
  score: number
  kind: SkillKind
  matchedBy: Array<'keyword' | 'tag' | 'kind' | 'forced'>
}
