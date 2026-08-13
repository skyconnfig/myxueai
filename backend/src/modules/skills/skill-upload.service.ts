import { parse as parseYaml } from 'yaml'
import {
  validateSkill,
  assertValidSkill,
  type SkillDefinition,
} from '@xueai/shared'
import { AppError } from '../../middleware/error-handler.js'
import { skillLoader } from './skill-loader.js'
import { skillManager } from './skill-manager.js'
import { skillMarketplaceService } from './marketplace/skill-marketplace.service.js'

export interface UploadSkillInput {
  content: string
  format?: 'yaml' | 'json'
  marketplace?: {
    public?: boolean
    summary?: string
    tags?: string[]
    author?: string
    category?: string
  }
}

export class SkillUploadService {
  async listAll(): Promise<{
    builtin: SkillDefinition[]
    user: SkillDefinition[]
    bundles: SkillDefinition[]
  }> {
    const registry = await skillManager.ensureLoaded({ reload: true })
    return {
      builtin: registry.skills.filter((s) => (s.rules.source as string | undefined) !== 'user_upload'),
      user: registry.userSkills,
      bundles: registry.bundles,
    }
  }

  async getById(id: string): Promise<SkillDefinition | undefined> {
    await skillManager.ensureLoaded()
    return skillManager.getSkill(id)
  }

  async upload(input: UploadSkillInput): Promise<SkillDefinition> {
    let raw: unknown
    try {
      if (input.format === 'json') {
        raw = JSON.parse(input.content) as unknown
      } else {
        raw = parseYaml(input.content) as unknown
      }
    } catch {
      throw new AppError(400, 'INVALID_SKILL_FORMAT', 'Skill 文件格式无效')
    }

    if (input.marketplace && typeof raw === 'object' && raw !== null) {
      const doc = raw as Record<string, unknown>
      const rules = (doc.rules as Record<string, unknown> | undefined) ?? {}
      raw = {
        ...doc,
        rules: {
          ...rules,
          marketplace: skillMarketplaceService.buildUserMarketplaceMeta(input.marketplace),
        },
      }
    }

    const validated = assertValidSkill(raw)

    const existing = skillManager.getSkill(validated.id)
    if (existing && (existing.rules.source as string | undefined) !== 'user_upload') {
      throw new AppError(409, 'SKILL_ID_RESERVED', `Skill id "${validated.id}" 已被系统占用`)
    }

    await skillLoader.saveUserSkill(validated)
    await skillManager.load({ reload: true })
    return skillManager.getSkill(validated.id)!
  }

  async remove(id: string): Promise<void> {
    const skill = skillManager.getSkill(id)
    if (!skill) {
      throw new AppError(404, 'SKILL_NOT_FOUND', 'Skill 不存在')
    }
    if ((skill.rules.source as string | undefined) !== 'user_upload') {
      throw new AppError(403, 'SKILL_NOT_DELETABLE', '仅可删除用户上传的 Skill')
    }
    const ok = await skillLoader.deleteUserSkill(id)
    if (!ok) {
      throw new AppError(404, 'SKILL_FILE_NOT_FOUND', 'Skill 文件不存在')
    }
    await skillManager.load({ reload: true })
  }

  validateContent(content: string, format: 'yaml' | 'json' = 'yaml') {
    let raw: unknown
    if (format === 'json') {
      raw = JSON.parse(content) as unknown
    } else {
      raw = parseYaml(content) as unknown
    }
    return validateSkill(raw)
  }
}

export const skillUploadService = new SkillUploadService()
