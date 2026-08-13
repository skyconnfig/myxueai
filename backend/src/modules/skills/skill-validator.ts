import {
  validateSkill,
  validateSkills,
  type SkillDefinition,
  type SkillValidationResult,
} from '@xueai/shared'

export type { SkillValidationResult }

/** Re-export shared validator for backend consumers. */
export function validateSkillDocument(
  raw: unknown,
  sourcePath?: string,
): SkillValidationResult {
  return validateSkill(raw, { sourcePath })
}

export function validateSkillDocuments(
  items: Array<{ raw: unknown; sourcePath?: string }>,
  strict = false,
): { valid: SkillDefinition[]; results: SkillValidationResult[] } {
  return validateSkills(items, { strict })
}

export function isValidSkill(raw: unknown): raw is SkillDefinition {
  return validateSkill(raw).ok
}
