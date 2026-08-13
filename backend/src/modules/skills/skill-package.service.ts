import fs from 'node:fs/promises'
import path from 'node:path'
import AdmZip from 'adm-zip'
import { parse as parseYaml } from 'yaml'
import {
  assertValidSkill,
  validateSkill,
  type SkillDefinition,
} from '@xueai/shared'
import { AppError } from '../../middleware/error-handler.js'
import { storagePaths } from '../../config/storage.js'
import { skillLoader } from './skill-loader.js'
import { skillManager } from './skill-manager.js'
import { skillMarketplaceService } from './marketplace/skill-marketplace.service.js'
import type { UploadSkillInput } from './skill-upload.service.js'

const SKILL_EXTENSIONS = new Set(['.json', '.yaml', '.yml'])
const SKIP_DIR_NAMES = new Set(['__macosx', 'node_modules', '.git', '.svn'])
const SKIP_FILE_NAMES = new Set(['.ds_store', 'thumbs.db'])

export interface PackageFileEntry {
  relativePath: string
  buffer: Buffer
}

export interface SkillPackageInstallResult {
  packageDir: string
  installed: SkillDefinition[]
  skipped: string[]
  errors: Array<{ path: string; message: string }>
}

function resolveUserSkillsDir(): string {
  return process.env.SKILLS_USER_DIR ?? path.join(storagePaths.root, 'skills', 'user')
}

function normalizeRelativePath(input: string): string {
  return input
    .replace(/\\/g, '/')
    .replace(/^\/+/, '')
    .replace(/^\.\/+/, '')
}

function shouldSkipPath(relativePath: string): boolean {
  const parts = normalizeRelativePath(relativePath).split('/').filter(Boolean)
  if (!parts.length) return true
  if (parts.some((p) => p.startsWith('.') || SKIP_DIR_NAMES.has(p.toLowerCase()))) return true
  const base = parts[parts.length - 1]?.toLowerCase() ?? ''
  if (SKIP_FILE_NAMES.has(base)) return true
  return false
}

function isSkillDefinitionPath(relativePath: string): boolean {
  const ext = path.extname(relativePath).toLowerCase()
  if (!SKILL_EXTENSIONS.has(ext)) return false
  const base = path.basename(relativePath).toLowerCase()
  if (base === 'catalog.yaml' || base === 'catalog.yml' || base === 'catalog.json') return false
  return true
}

function parseSkillBuffer(buffer: Buffer, relativePath: string): unknown {
  const text = buffer.toString('utf8')
  const ext = path.extname(relativePath).toLowerCase()
  if (ext === '.json') return JSON.parse(text) as unknown
  return parseYaml(text) as unknown
}

function applyMarketplaceMeta(
  raw: unknown,
  marketplace?: UploadSkillInput['marketplace'],
): unknown {
  if (!marketplace || typeof raw !== 'object' || raw === null) return raw
  const doc = raw as Record<string, unknown>
  const rules = (doc.rules as Record<string, unknown> | undefined) ?? {}
  const existingMarketplace = rules.marketplace as Record<string, unknown> | undefined
  if (existingMarketplace && Object.keys(existingMarketplace).length > 0) return raw
  return {
    ...doc,
    rules: {
      ...rules,
      marketplace: skillMarketplaceService.buildUserMarketplaceMeta(marketplace),
    },
  }
}

function inferPackageName(entries: PackageFileEntry[]): string {
  const first = entries.find((e) => !shouldSkipPath(e.relativePath))
  if (!first) return `skill-pack-${Date.now()}`
  const parts = normalizeRelativePath(first.relativePath).split('/').filter(Boolean)
  if (parts.length > 1) {
    const root = parts[0]!.replace(/[^a-z0-9._-]/gi, '-').toLowerCase()
    if (root && root !== 'skills') return root
  }
  const stem = path.basename(first.relativePath, path.extname(first.relativePath))
  return stem.replace(/[^a-z0-9._-]/gi, '-').toLowerCase() || `skill-pack-${Date.now()}`
}

export class SkillPackageService {
  extractZip(buffer: Buffer): PackageFileEntry[] {
    const zip = new AdmZip(buffer)
    const entries: PackageFileEntry[] = []
    for (const entry of zip.getEntries()) {
      if (entry.isDirectory) continue
      const relativePath = normalizeRelativePath(entry.entryName)
      if (shouldSkipPath(relativePath)) continue
      entries.push({
        relativePath,
        buffer: entry.getData(),
      })
    }
    return entries
  }

  fromMulterFiles(
    files: Array<{ originalname: string; buffer: Buffer }>,
  ): PackageFileEntry[] {
    return files
      .map((file) => ({
        relativePath: normalizeRelativePath(file.originalname),
        buffer: file.buffer,
      }))
      .filter((entry) => !shouldSkipPath(entry.relativePath))
  }

  async install(entries: PackageFileEntry[], marketplace?: UploadSkillInput['marketplace']): Promise<SkillPackageInstallResult> {
    if (!entries.length) {
      throw new AppError(400, 'EMPTY_SKILL_PACKAGE', '压缩包或文件夹为空，未找到可安装文件')
    }

    const userDir = resolveUserSkillsDir()
    const packageName = inferPackageName(entries)
    const packageDir = path.join(userDir, 'packages', `${packageName}-${Date.now()}`)
    await fs.mkdir(packageDir, { recursive: true })

    for (const entry of entries) {
      const dest = path.join(packageDir, entry.relativePath)
      await fs.mkdir(path.dirname(dest), { recursive: true })
      await fs.writeFile(dest, entry.buffer)
    }

    const skillFiles = entries.filter((e) => isSkillDefinitionPath(e.relativePath))
    if (!skillFiles.length) {
      await fs.rm(packageDir, { recursive: true, force: true })
      throw new AppError(
        400,
        'NO_SKILL_DEFINITION',
        '未识别到 Skill 定义文件，请确保包内包含 .yaml / .yml / .json 格式的 Skill 配置',
      )
    }

    await skillManager.ensureLoaded()
    const installed: SkillDefinition[] = []
    const skipped: string[] = []
    const errors: Array<{ path: string; message: string }> = []

    for (const file of skillFiles) {
      let raw: unknown
      try {
        raw = parseSkillBuffer(file.buffer, file.relativePath)
      } catch {
        errors.push({ path: file.relativePath, message: '文件格式无效，无法解析 YAML/JSON' })
        continue
      }

      raw = applyMarketplaceMeta(raw, marketplace)
      const validation = validateSkill(raw, { sourcePath: file.relativePath })
      if (!validation.ok || !validation.skill) {
        skipped.push(file.relativePath)
        errors.push({
          path: file.relativePath,
          message: validation.errors.map((e) => `${e.path}: ${e.message}`).join('; ') || '不是有效的 Skill 定义',
        })
        continue
      }

      let skill: SkillDefinition
      try {
        skill = assertValidSkill(raw, file.relativePath)
      } catch (err) {
        errors.push({
          path: file.relativePath,
          message: err instanceof Error ? err.message : 'Skill 校验失败',
        })
        continue
      }

      const existing = skillManager.getSkill(skill.id)
      if (existing && (existing.rules.source as string | undefined) !== 'user_upload') {
        errors.push({
          path: file.relativePath,
          message: `Skill id "${skill.id}" 已被系统占用`,
        })
        continue
      }

      const payload = {
        ...skill,
        rules: { ...skill.rules, source: 'user_upload' },
      }
      await skillLoader.saveUserSkill(payload)
      installed.push(payload)
    }

    if (!installed.length) {
      await fs.rm(packageDir, { recursive: true, force: true }).catch(() => undefined)
      const detail = errors.slice(0, 3).map((e) => `${e.path}: ${e.message}`).join(' | ')
      throw new AppError(
        400,
        'SKILL_PACKAGE_INSTALL_FAILED',
        `未能安装任何 Skill${detail ? `：${detail}` : ''}`,
      )
    }

    await skillManager.load({ reload: true })

    return {
      packageDir: path.relative(userDir, packageDir),
      installed,
      skipped,
      errors,
    }
  }
}

export const skillPackageService = new SkillPackageService()
