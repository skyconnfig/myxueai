import { z } from 'zod'
import {
  skillDefinitionSchema,
  type SkillDefinition,
  type SkillValidationResult,
} from './schema.js'

export interface ValidateSkillOptions {
  sourcePath?: string
}

function formatZodErrors(error: z.ZodError): SkillValidationResult['errors'] {
  return error.errors.map((issue) => ({
    path: issue.path.join('.') || '(root)',
    message: issue.message,
  }))
}

/** Parse and validate an unknown object as a SkillDefinition. */
export function validateSkill(
  raw: unknown,
  options: ValidateSkillOptions = {},
): SkillValidationResult {
  const parsed = skillDefinitionSchema.safeParse(raw)
  if (parsed.success) {
    return {
      ok: true,
      skill: parsed.data,
      errors: [],
      sourcePath: options.sourcePath,
    }
  }
  return {
    ok: false,
    errors: formatZodErrors(parsed.error),
    sourcePath: options.sourcePath,
  }
}

/** Validate many skills; returns only successful definitions by default. */
export function validateSkills(
  items: Array<{ raw: unknown; sourcePath?: string }>,
  options: { strict?: boolean } = {},
): {
  valid: SkillDefinition[]
  results: SkillValidationResult[]
} {
  const results = items.map((item) =>
    validateSkill(item.raw, { sourcePath: item.sourcePath }),
  )
  const valid = results.filter((r) => r.ok && r.skill).map((r) => r.skill!)
  if (options.strict && results.some((r) => !r.ok)) {
    const failed = results.filter((r) => !r.ok)
    const messages = failed.flatMap((r) =>
      r.errors.map((e) => `${r.sourcePath ?? '?'}: ${e.path} — ${e.message}`),
    )
    throw new Error(`Skill validation failed:\n${messages.join('\n')}`)
  }
  return { valid, results }
}

/** Assert skill is valid; throws with formatted message. */
export function assertValidSkill(raw: unknown, sourcePath?: string): SkillDefinition {
  const result = validateSkill(raw, { sourcePath })
  if (!result.ok || !result.skill) {
    const msg = result.errors.map((e) => `${e.path}: ${e.message}`).join('; ')
    throw new Error(`Invalid skill${sourcePath ? ` at ${sourcePath}` : ''}: ${msg}`)
  }
  return result.skill
}
