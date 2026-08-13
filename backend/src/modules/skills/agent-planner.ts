import type { AgentPlan } from '@xueai/shared'
import { agentPlanSchema, expandBundleSkills } from '@xueai/shared'
import { buildSkillRouteContext, categoryToTags } from './core/skill-context.js'
import { skillManager } from './skill-manager.js'
import { skillRouter } from './manager/skill-router.js'

export interface AgentPlannerInput {
  topic: string
  style?: string
  videoStyle?: string
  duration?: number
  audience?: string
  goal?: string
  ratio?: string
  /** Explicit user-uploaded or custom skill ids to include. */
  userSkillIds?: string[]
}

const CATEGORY_HINTS: Array<{ category: string; pattern: RegExp; tags: string[] }> = [
  { category: 'product_demo', pattern: /产品|demo|dashboard|工作流|saas|ui|自动化|软件/i, tags: ['product_demo'] },
  { category: 'tech_documentary', pattern: /纪录片|documentary|深度|技术解读|访谈|纪实|科技/i, tags: ['tech_documentary'] },
  { category: 'viral_short', pattern: /短视频|爆款|viral|抖音|快手|竖屏|15秒/i, tags: ['viral_short'] },
  { category: 'education', pattern: /科普|知识|教育|讲解|教程|education|学习|入门|原理/i, tags: ['education'] },
  { category: 'advertisement', pattern: /广告|宣传|品牌|商业|advertisement|推广|营销/i, tags: ['advertisement'] },
  { category: 'commercial', pattern: /commercial/i, tags: ['commercial'] },
]

const STYLE_SKILL_BY_KEY: Record<string, string> = {
  technology: 'style.technology',
  tech: 'style.technology',
  cinematic: 'style.technology',
  commercial: 'style.technology',
}

const STYLE_CROSS_SKILLS: Record<string, string[]> = {
  technology: ['style.technology', 'caption.kinetic-tech', 'audio.cinematic-tech'],
  tech: ['style.technology', 'caption.kinetic-tech', 'audio.cinematic-tech'],
}

const BUNDLE_BY_CATEGORY: Record<string, string> = {
  product_demo: 'bundle.product-demo',
  tech_documentary: 'bundle.tech-documentary',
  viral_short: 'bundle.viral-short',
  education: 'bundle.education',
  advertisement: 'bundle.advertisement',
}

function resolveStyleKey(style: string, topic: string): string {
  const lower = style.toLowerCase()
  if (STYLE_CROSS_SKILLS[lower]) return lower
  if (/tech|科技|saas|ai|软件|agent/i.test(topic)) return 'technology'
  if (STYLE_SKILL_BY_KEY[lower]) return lower
  return lower
}

function inferCategoryHint(topic: string, videoStyle?: string): { category: string; tags: string[] } {
  for (const entry of CATEGORY_HINTS) {
    if (entry.pattern.test(topic) || (videoStyle && entry.pattern.test(videoStyle))) {
      return { category: entry.category, tags: entry.tags }
    }
  }
  return { category: 'commercial', tags: ['commercial'] }
}

/**
 * Agent Planner — Skill Layer entry point.
 * Flow: user input → bundle route → expand includes → merge user skills.
 */
export class AgentPlanner {
  async plan(input: AgentPlannerInput): Promise<AgentPlan> {
    const duration = input.duration ?? 30
    const style = input.videoStyle ?? input.style ?? 'commercial'
    const hint = inferCategoryHint(input.topic, input.videoStyle)

    await skillManager.ensureLoaded({ strict: true, reload: true })

    const routeContext = buildSkillRouteContext({
      topic: input.topic,
      category: hint.category,
      style,
      videoStyle: input.videoStyle,
      duration,
      audience: input.audience,
      goal: input.goal,
      ratio: input.ratio,
      tags: [...hint.tags, ...categoryToTags(hint.category)],
    })

    const route = skillRouter.route(
      skillManager.listSkills(),
      routeContext,
      {
        limit: 16,
        dedupeByKind: true,
        forceSkillIds: input.userSkillIds,
      },
    )

    let skillIds = [...route.resolvedSkillIds]

    // Fallback: bind category → bundle when router did not match a bundle
    if (!route.bundle && BUNDLE_BY_CATEGORY[hint.category]) {
      const bundle = skillManager.getSkill(BUNDLE_BY_CATEGORY[hint.category])
      if (bundle) {
        skillIds = expandBundleSkills(skillManager.listSkills(), bundle)
      }
    }

    // User-uploaded skills (when not explicitly forced via userSkillIds)
    if (!input.userSkillIds?.length) {
      for (const userSkill of skillManager.listUserSkills()) {
        const matched = skillRouter.route([userSkill], routeContext)
        if (matched.resolvedSkillIds.includes(userSkill.id)) {
          skillIds.push(userSkill.id)
        }
      }
    }

    // Style cross-cutting skills (Technology + Caption + Audio)
    const styleKey = resolveStyleKey(style, input.topic)
    const crossSkills = STYLE_CROSS_SKILLS[styleKey] ?? []
    for (const id of crossSkills) {
      if (skillManager.getSkill(id)) skillIds.push(id)
    }

    skillIds = [...new Set(skillIds.filter((id) => skillManager.getSkill(id)))]

    if (skillIds.length === 0) {
      skillIds = skillManager.listSkills()
        .filter((s) => s.kind !== 'bundle')
        .slice(0, 4)
        .map((s) => s.id)
    }

    const category = skillRouter.resolveCategory(route.bundle, hint.category)

    return agentPlanSchema.parse({
      category,
      style,
      duration,
      skills: skillIds,
    })
  }
}

export const agentPlanner = new AgentPlanner()
