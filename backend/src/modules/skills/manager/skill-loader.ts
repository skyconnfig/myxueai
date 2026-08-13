import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse as parseYaml, stringify as stringifyYaml } from 'yaml'
import {
  SKILL_KINDS,
  assertValidSkill,
  validateSkill,
  type SkillDefinition,
  type SkillKind,
  type SkillValidationResult,
} from '@xueai/shared'
import type { ISkillLoader } from '../core/skill.interface.js'
import type {
  LoadedSkillFile,
  SkillLoaderOptions,
  SkillRegistry,
} from '../core/skill.types.js'
import { storagePaths } from '../../../config/storage.js'

const MODULE_DIR = path.dirname(fileURLToPath(import.meta.url))
const DEFAULT_SKILLS_ROOT = path.resolve(MODULE_DIR, '../../../../../skills')

const SKILL_EXTENSIONS = new Set(['.json', '.yaml', '.yml'])
const EXTRA_SKILL_DIRS = ['user'] as const

function resolveSkillsRoot(rootDir?: string): string {
  return rootDir ?? process.env.SKILLS_ROOT ?? DEFAULT_SKILLS_ROOT
}

function resolveUserSkillsDir(): string {
  return process.env.SKILLS_USER_DIR ?? path.join(storagePaths.root, 'skills', 'user')
}

async function readSkillFile(filePath: string): Promise<unknown> {
  const text = await fs.readFile(filePath, 'utf8')
  const ext = path.extname(filePath).toLowerCase()
  if (ext === '.json') return JSON.parse(text) as unknown
  return parseYaml(text) as unknown
}

async function walkSkillDir(dir: string, files: string[]) {
  let entries: Array<{ name: string; isDirectory: () => boolean; isFile: () => boolean }>
  try {
    entries = await fs.readdir(dir, { withFileTypes: true })
  } catch {
    return
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name)
    if (entry.name.startsWith('_') || entry.name.startsWith('.')) continue
    if (entry.isDirectory()) {
      await walkSkillDir(full, files)
    } else if (entry.isFile() && SKILL_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) {
      files.push(full)
    }
  }
}

async function collectSkillFiles(
  rootDir: string,
  userDir: string,
  includeUser: boolean,
): Promise<Array<{ path: string; origin: LoadedSkillFile['origin']; relativeRoot: string }>> {
  const out: Array<{ path: string; origin: LoadedSkillFile['origin']; relativeRoot: string }> = []

  for (const kind of SKILL_KINDS) {
    const files: string[] = []
    await walkSkillDir(path.join(rootDir, kind), files)
    for (const f of files) {
      out.push({ path: f, origin: 'builtin', relativeRoot: rootDir })
    }
  }

  for (const extra of EXTRA_SKILL_DIRS) {
    const files: string[] = []
    await walkSkillDir(path.join(rootDir, extra), files)
    for (const f of files) {
      out.push({ path: f, origin: 'builtin', relativeRoot: rootDir })
    }
  }

  if (includeUser) {
    const userFiles: string[] = []
    await walkSkillDir(userDir, userFiles)
    for (const f of userFiles) {
      out.push({ path: f, origin: 'user', relativeRoot: userDir })
    }
  }

  return out.sort((a, b) => a.path.localeCompare(b.path))
}

function buildRegistry(
  rootDir: string,
  userDir: string,
  skills: SkillDefinition[],
  loadResults: SkillValidationResult[],
): SkillRegistry {
  const byId = new Map<string, SkillDefinition>()
  const byKind = new Map<SkillKind, SkillDefinition[]>()
  for (const kind of SKILL_KINDS) byKind.set(kind, [])

  for (const skill of skills) {
    if (byId.has(skill.id)) continue
    byId.set(skill.id, skill)
    byKind.get(skill.kind)?.push(skill)
  }

  return {
    rootDir,
    userDir,
    skills,
    byId,
    byKind,
    bundles: skills.filter((s) => s.kind === 'bundle'),
    userSkills: skills.filter((s) => (s.rules.source as string | undefined) === 'user_upload'),
    loadResults,
  }
}

/** Load skill YAML/JSON packs from repo `skills/` and user storage. */
export class SkillLoader implements ISkillLoader {
  private registry: SkillRegistry | null = null

  getDefaultRoot(): string {
    return resolveSkillsRoot()
  }

  getUserDir(): string {
    return resolveUserSkillsDir()
  }

  async loadFiles(options: SkillLoaderOptions = {}): Promise<LoadedSkillFile[]> {
    const root = resolveSkillsRoot(options.rootDir)
    const userDir = resolveUserSkillsDir()
    const entries = await collectSkillFiles(root, userDir, options.includeUserSkills !== false)
    const loaded: LoadedSkillFile[] = []
    for (const entry of entries) {
      const raw = await readSkillFile(entry.path)
      loaded.push({
        sourcePath: entry.path,
        relativePath: path.relative(entry.relativeRoot, entry.path),
        raw,
        origin: entry.origin,
      })
    }
    return loaded
  }

  async load(options: SkillLoaderOptions = {}): Promise<SkillRegistry> {
    const rootDir = resolveSkillsRoot(options.rootDir)
    const userDir = resolveUserSkillsDir()
    await fs.mkdir(userDir, { recursive: true })

    const files = await this.loadFiles(options)
    const loadResults: SkillValidationResult[] = []
    const skills: SkillDefinition[] = []

    for (const file of files) {
      const raw =
        file.origin === 'user' && typeof file.raw === 'object' && file.raw !== null
          ? {
              ...(file.raw as Record<string, unknown>),
              rules: {
                ...((file.raw as { rules?: Record<string, unknown> }).rules ?? {}),
                source: 'user_upload',
              },
            }
          : file.raw

      const result = validateSkill(raw, { sourcePath: file.relativePath })
      loadResults.push(result)
      if (result.ok && result.skill) {
        skills.push(result.skill)
      } else if (options.strict) {
        const msg = result.errors.map((e: { path: string; message: string }) => `${e.path}: ${e.message}`).join('; ')
        throw new Error(`Invalid skill ${file.relativePath}: ${msg}`)
      }
    }

    if (options.strict) {
      const seen = new Set<string>()
      for (const skill of skills) {
        if (seen.has(skill.id)) {
          throw new Error(`Duplicate skill id: ${skill.id}`)
        }
        seen.add(skill.id)
      }
    }

    this.registry = buildRegistry(rootDir, userDir, skills, loadResults)
    return this.registry
  }

  getRegistry(): SkillRegistry | null {
    return this.registry
  }

  async loadOne(filePath: string): Promise<SkillDefinition> {
    const raw = await readSkillFile(filePath)
    return assertValidSkill(raw, filePath)
  }

  async saveUserSkill(skill: SkillDefinition): Promise<string> {
    const userDir = resolveUserSkillsDir()
    await fs.mkdir(userDir, { recursive: true })
    const safeId = skill.id.replace(/[^a-z0-9._-]/gi, '-')
    const filePath = path.join(userDir, `${safeId}.yaml`)
    const payload = {
      ...skill,
      rules: { ...skill.rules, source: 'user_upload' },
    }
    await fs.writeFile(filePath, stringifyYaml(payload), 'utf8')
    this.registry = null
    return filePath
  }

  async deleteUserSkill(skillId: string): Promise<boolean> {
    const userDir = resolveUserSkillsDir()
    const safeId = skillId.replace(/[^a-z0-9._-]/gi, '-')
    for (const ext of ['.yaml', '.yml', '.json']) {
      const filePath = path.join(userDir, `${safeId}${ext}`)
      try {
        await fs.unlink(filePath)
        this.registry = null
        return true
      } catch {
        // try next extension
      }
    }
    return false
  }
}

export const skillLoader = new SkillLoader()
