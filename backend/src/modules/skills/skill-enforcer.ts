import { buildDefaultProductDemoSteps, type SkillDefinition, type UiStep } from '@xueai/shared'
import type { VideoPlan, VideoPlanScene } from '../project/project.types.js'

type SkillRules = SkillDefinition['rules']

const GLOBAL_SKILL_KINDS = new Set<SkillDefinition['kind']>(['style', 'caption', 'audio', 'camera', 'platform'])

function getAppliesToBeats(rules: SkillRules): string[] {
  const applies = rules.appliesTo as { storyBeats?: string[] } | undefined
  return applies?.storyBeats ?? []
}

function isGlobalSkill(skill: SkillDefinition, rules: SkillRules): boolean {
  const applies = rules.appliesTo as { global?: boolean } | undefined
  if (applies?.global === true) return true
  if (GLOBAL_SKILL_KINDS.has(skill.kind) && getAppliesToBeats(rules).length === 0) return true
  return false
}

function sceneMatchesSkill(scene: VideoPlanScene, skill: SkillDefinition, rules: SkillRules): boolean {
  if (isGlobalSkill(skill, rules)) return true
  const beats = getAppliesToBeats(rules)
  if (beats.length === 0) return false
  const beat = scene.storyBeat ?? ''
  return beats.some((b) => beat.toLowerCase().includes(b.toLowerCase()))
}

function scaleUiStepsTemplate(template: UiStep[], duration: number): UiStep[] {
  return template.map((step) => ({
    ...step,
    at: Number((step.at * duration).toFixed(2)),
    duration: step.duration,
  }))
}

function ensureUiSteps(scene: VideoPlanScene, rules: SkillRules): UiStep[] {
  const uiRules = rules.uiStepsTemplate as UiStep[] | undefined
  const req = rules.director as {
    uiSteps?: { minCount?: number; requiredActions?: string[] }
  } | undefined
  const minCount = req?.uiSteps?.minCount ?? 3
  const requiredActions = req?.uiSteps?.requiredActions ?? []

  let steps = scene.uiSteps ?? []

  if (steps.length < minCount && Array.isArray(uiRules) && uiRules.length) {
    steps = scaleUiStepsTemplate(uiRules, scene.duration)
  }

  if (steps.length < minCount) {
    steps = buildDefaultProductDemoSteps({
      process: scene.process ?? scene.action,
      result: scene.result ?? scene.voice,
      duration: scene.duration,
    })
  }

  for (const action of requiredActions) {
    if (!steps.some((s) => s.action === action)) {
      if (action === 'dataChange') {
        steps.push({
          at: Math.max(1, scene.duration * 0.75),
          action: 'dataChange',
          target: 'users',
          value: 520000,
        })
      } else if (action === 'navigate') {
        steps.push({
          at: Math.max(0.5, scene.duration * 0.5),
          action: 'navigate',
          target: 'analytics',
          value: 'Analytics',
          duration: 0.8,
        })
      } else if (action === 'click') {
        steps.push({ at: Math.max(0.4, scene.duration * 0.45), action: 'click', target: 'runButton' })
      } else if (action === 'move') {
        steps.push({ at: Math.max(0.3, scene.duration * 0.35), action: 'move', target: 'runButton' })
      }
    }
  }

  return steps.sort((a, b) => a.at - b.at)
}

function applySkillToScene(scene: VideoPlanScene, skill: SkillDefinition): VideoPlanScene {
  const rules = skill.rules
  if (!sceneMatchesSkill(scene, skill, rules)) return scene

  const require = rules.require as {
    componentType?: string
    sceneType?: string
  } | undefined
  const director = rules.director as Record<string, unknown> | undefined
  const sceneRules = rules.scene as { lighting?: string; emotion?: string } | undefined
  const productRules = director?.productDemo as {
    required?: boolean
    simulator?: boolean
    device?: string
  } | undefined
  const shotRule = rules.shot as VideoPlanScene['shot']
  const captionRule = (rules.captionStyle ?? rules.caption) as VideoPlanScene['captionStyle']
  const audioRule = rules.audio as { sfx?: string; bgm?: string } | undefined

  const next: VideoPlanScene = { ...scene }

  if (require?.componentType) next.componentType = require.componentType
  if (require?.sceneType) next.sceneType = require.sceneType

  if (sceneRules?.lighting && !next.lighting) next.lighting = sceneRules.lighting
  if (sceneRules?.emotion && !next.emotion) next.emotion = sceneRules.emotion

  if (shotRule && typeof shotRule === 'object') {
    next.shot = { ...next.shot, ...shotRule }
    if (shotRule.type && !next.shotType) {
      next.shotType = shotRule.type === 'close' ? 'close_up' : String(shotRule.type)
    }
    if (shotRule.camera && !next.cameraMotion) {
      next.cameraMotion = shotRule.camera === 'push_in' ? 'dolly_in' : String(shotRule.camera)
    }
  }

  if (captionRule && typeof captionRule === 'object') {
    next.captionStyle = { ...next.captionStyle, ...captionRule }
  }

  if (audioRule) {
    next.audio = { ...next.audio, ...(audioRule.sfx ? { sfx: audioRule.sfx } : {}) }
    if (audioRule.bgm && !next.bgmIntensity) next.bgmIntensity = 'medium'
  }

  if (director?.uiSteps || rules.uiStepsTemplate) {
    next.uiSteps = ensureUiSteps(next, rules)
  }

  if (productRules?.required) {
    next.productDemo = {
      ...next.productDemo,
      device: (productRules.device as 'browser' | 'phone' | 'both') ?? 'browser',
      metric: next.productDemo?.metric ?? { label: '效率提升', value: 300, suffix: '%' },
      ...(productRules.simulator ? { simulator: true } : {}),
    }
  }

  if (!next.input) next.input = next.description.slice(0, 40)
  if (!next.process) next.process = next.action?.slice(0, 40) ?? '用户点击运行'
  if (!next.result) next.result = next.voice?.slice(0, 40) ?? '效率提升'

  return next
}

function applyPlanLevelRules(plan: VideoPlan, skills: SkillDefinition[]): VideoPlan {
  let brief = plan.directorBrief
  for (const skill of skills) {
    if (skill.kind !== 'style') continue
    const director = skill.rules.director as { style?: { preset?: string } } | undefined
    const preset = director?.style?.preset
    if (preset && brief) {
      brief = { ...brief, video_style: preset }
    }
  }
  return brief !== plan.directorBrief ? { ...plan, directorBrief: brief } : plan
}

/** Post-process VideoPlan to enforce active skill rules (deterministic). */
export function enforceSkillRules(plan: VideoPlan, skills: SkillDefinition[]): VideoPlan {
  if (skills.length === 0) return plan

  const sorted = [...skills].sort(
    (a, b) => (Number(b.rules.priority) || 0) - (Number(a.rules.priority) || 0),
  )

  const scenes = plan.scenes.map((scene) =>
    sorted.reduce((acc, skill) => applySkillToScene(acc, skill), scene),
  )

  return applyPlanLevelRules({ ...plan, scenes }, sorted)
}
