import type { Request, Response, NextFunction } from 'express'
import multer from 'multer'
import { z } from 'zod'
import { sendSuccess } from '../../utils/response.js'
import { AppError } from '../../middleware/error-handler.js'
import { skillUploadService } from './skill-upload.service.js'
import { skillPackageService } from './skill-package.service.js'
import { skillManager } from './skill-manager.js'
import { agentPlanner } from './agent-planner.js'
import { skillRouter } from './manager/skill-router.js'
import { buildSkillRouteContext } from './core/skill-context.js'
import { skillMarketplaceService } from './marketplace/skill-marketplace.service.js'

const uploadSkillSchema = z.object({
  content: z.string().min(10),
  format: z.enum(['yaml', 'json']).optional().default('yaml'),
  marketplace: z
    .object({
      public: z.boolean().optional(),
      summary: z.string().optional(),
      tags: z.array(z.string()).optional(),
      author: z.string().optional(),
      category: z.string().optional(),
    })
    .optional(),
})

const planSchema = z.object({
  topic: z.string().min(1),
  style: z.string().optional(),
  videoStyle: z.string().optional(),
  duration: z.number().int().positive().optional(),
  audience: z.string().optional(),
  goal: z.string().optional(),
  ratio: z.string().optional(),
  userSkillIds: z.array(z.string()).optional(),
})

const matchSchema = z.object({
  text: z.string().min(1),
  style: z.string().optional(),
  category: z.string().optional(),
  platform: z.string().optional(),
  userSkillIds: z.array(z.string()).optional(),
})

const validateSchema = z.object({
  content: z.string().min(1),
  format: z.enum(['yaml', 'json']).optional().default('yaml'),
})

const marketplaceQuerySchema = z.object({
  tier: z.enum(['official', 'community', 'user']).optional(),
  kind: z.string().optional(),
  category: z.string().optional(),
  featured: z.enum(['true', 'false']).optional(),
  search: z.string().optional(),
})

const packageUploadMetaSchema = z.object({
  author: z.string().optional(),
  summary: z.string().optional(),
  category: z.string().optional(),
})

const skillUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024, files: 200 },
})

function paramId(value: string | string[]): string {
  return Array.isArray(value) ? value[0] ?? '' : value
}

export const skillsController = {
  list: async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await skillUploadService.listAll()
      sendSuccess(res, data)
    } catch (err) {
      next(err)
    }
  },

  marketplace: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const query = marketplaceQuerySchema.parse(req.query)
      const data = await skillMarketplaceService.list({
        tier: query.tier,
        kind: query.kind as never,
        category: query.category,
        featured: query.featured === 'true',
        search: query.search,
      })
      sendSuccess(res, data)
    } catch (err) {
      next(err)
    }
  },

  marketplaceItem: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = paramId(req.params.id)
      const listing = await skillMarketplaceService.getListing(id)
      if (!listing) {
        res.status(404).json({ success: false, error: { code: 'SKILL_NOT_FOUND', message: 'Skill 不存在' } })
        return
      }
      const skill = await skillUploadService.getById(id)
      sendSuccess(res, { listing, skill })
    } catch (err) {
      next(err)
    }
  },

  userSkills: async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const listings = await skillMarketplaceService.listUserSkills()
      sendSuccess(res, { listings, total: listings.length })
    } catch (err) {
      next(err)
    }
  },

  match: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const body = matchSchema.parse(req.body)
      await skillManager.ensureLoaded({ strict: true })
      const context = buildSkillRouteContext({
        topic: body.text,
        category: body.category,
        style: body.style,
        platform: body.platform,
      })
      const route = skillRouter.route(skillManager.listSkills(), context, {
        dedupeByKind: true,
        forceSkillIds: body.userSkillIds,
      })
      sendSuccess(res, {
        skills: route.resolvedSkillIds,
        scores: route.scores,
        bundle: route.bundle?.id ?? null,
      })
    } catch (err) {
      next(err)
    }
  },

  validate: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const body = validateSchema.parse(req.body)
      const result = skillUploadService.validateContent(body.content, body.format)
      sendSuccess(res, result)
    } catch (err) {
      next(err)
    }
  },

  get: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = paramId(req.params.id)
      const skill = await skillUploadService.getById(id)
      if (!skill) {
        res.status(404).json({ success: false, error: { code: 'SKILL_NOT_FOUND', message: 'Skill 不存在' } })
        return
      }
      sendSuccess(res, skill)
    } catch (err) {
      next(err)
    }
  },

  upload: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const body = uploadSkillSchema.parse(req.body)
      const skill = await skillUploadService.upload(body)
      res.status(201)
      sendSuccess(res, skill)
    } catch (err) {
      next(err)
    }
  },

  uploadPackage: [
    skillUpload.fields([
      { name: 'archive', maxCount: 1 },
      { name: 'files', maxCount: 200 },
    ]),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const meta = packageUploadMetaSchema.parse(req.body)
        const files = req.files as { archive?: Express.Multer.File[]; files?: Express.Multer.File[] } | undefined
        const archive = files?.archive?.[0]
        const folderFiles = files?.files ?? []

        let entries
        if (archive) {
          entries = skillPackageService.extractZip(archive.buffer)
        } else if (folderFiles.length) {
          entries = skillPackageService.fromMulterFiles(folderFiles)
        } else {
          throw new AppError(400, 'NO_PACKAGE', '请上传 ZIP 压缩包或 Skill 文件夹')
        }

        const result = await skillPackageService.install(entries, {
          public: true,
          author: meta.author || 'Community',
          summary: meta.summary,
          category: meta.category || 'community',
        })

        res.status(201)
        sendSuccess(res, {
          packageDir: result.packageDir,
          installed: result.installed,
          installedIds: result.installed.map((s) => s.id),
          skipped: result.skipped,
          errors: result.errors,
          total: result.installed.length,
        })
      } catch (err) {
        next(err)
      }
    },
  ],

  remove: async (req: Request, res: Response, next: NextFunction) => {
    try {
      await skillUploadService.remove(paramId(req.params.id))
      sendSuccess(res, { deleted: true })
    } catch (err) {
      next(err)
    }
  },

  plan: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const input = planSchema.parse(req.body)
      const plan = await agentPlanner.plan(input)
      const bundle = skillManager.listBundles().find((b) =>
        plan.skills.includes(b.id) || (b.rules.category as string) === plan.category,
      )
      sendSuccess(res, { plan, bundle: bundle?.id ?? null })
    } catch (err) {
      next(err)
    }
  },
}
