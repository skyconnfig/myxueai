import type { DirectorPlan, StoryboardScene } from '@xueai/shared'
import { buildScenePropsFromDirectorScene } from '@xueai/shared'

const PURPOSE_ORDER = ['hook', 'problem', 'solution', 'demo', 'result', 'cta']

function normalizePurpose(purpose: string) {
  const lower = purpose.toLowerCase()
  if (lower.includes('hook') || lower.includes('开场')) return 'hook'
  if (lower.includes('problem') || lower.includes('痛点') || lower === 'pain') return 'problem'
  if (lower.includes('solution') || lower.includes('方案')) return 'solution'
  if (lower.includes('demo') || lower.includes('演示')) return 'demo'
  if (lower.includes('result') || lower.includes('效果')) return 'result'
  if (lower.includes('cta') || lower.includes('行动')) return 'cta'
  return purpose
}

function defaultComponentType(purpose: string, assetType?: string, explicit?: string) {
  if (explicit) return explicit
  if (assetType === 'stock' || purpose === 'problem' || purpose === 'result') return 'broll_video'
  if (purpose === 'demo') return 'ProductDemo'
  if (purpose === 'solution') return 'BrowserWindow'
  if (purpose === 'hook') return 'cinematic_still'
  return 'cinematic_still'
}

function defaultViewerTask(purpose: string) {
  const map: Record<string, string> = {
    hook: '抓住注意力，理解主题',
    problem: '认同痛点场景',
    solution: '理解产品如何解决',
    demo: '观看功能演示',
    result: '感受使用效果',
    cta: '记住行动号召',
  }
  return map[purpose] ?? '理解本镜信息'
}

export function validateStoryboardScene(scene: StoryboardScene): string[] {
  const errors: string[] = []
  if (!scene.visual?.description?.trim()) errors.push(`Scene ${scene.order}: missing visual description`)
  if (!scene.audio?.voiceover?.trim()) errors.push(`Scene ${scene.order}: missing voiceover`)
  if (!scene.input?.trim()) errors.push(`Scene ${scene.order}: missing IPR input`)
  if (!scene.process?.trim()) errors.push(`Scene ${scene.order}: missing IPR process`)
  if (!scene.result?.trim()) errors.push(`Scene ${scene.order}: missing IPR result`)
  if (scene.duration < 2) errors.push(`Scene ${scene.order}: duration too short`)
  return errors
}

export function buildStoryboardFromDirectorPlan(plan: DirectorPlan): StoryboardScene[] {
  return plan.scenes.map((scene, index) => {
    const purpose = normalizePurpose(scene.purpose)
    const componentType = defaultComponentType(
      purpose,
      scene.assetRequirement.type,
      scene.componentType ?? scene.assetRequirement.componentType,
    )

    const input = scene.input?.trim() || scene.visualDescription.slice(0, 80)
    const process = scene.process?.trim() || scene.motionDescription.slice(0, 120)
    const result = scene.result?.trim() || scene.voiceover.slice(0, 80)

    const draft: StoryboardScene = {
      order: index + 1,
      duration: Math.max(2, scene.duration),
      purpose,
      componentType,
      camera: {
        shotType: scene.shotType,
        movement: scene.cameraMovement,
        lighting: scene.lighting,
      },
      motion: {
        pattern: scene.cameraMovement,
        description: scene.motionDescription,
      },
      visual: {
        description: scene.visualDescription,
        prompt: scene.visualDescription,
      },
      audio: {
        voiceover: scene.voiceover,
        sfx: scene.soundEffect ? [scene.soundEffect] : undefined,
      },
      transition: index === 0 ? 'cut' : 'crossfade',
      viewerTask: defaultViewerTask(purpose),
      input,
      process,
      result,
      assetRequirement: scene.assetRequirement,
      uiSteps: scene.uiSteps,
    }

    const sceneProps = buildScenePropsFromDirectorScene({
      purpose,
      componentType,
      duration: draft.duration,
      title: scene.visualDescription.slice(0, 80),
      input,
      process,
      result,
      voiceover: scene.voiceover,
      uiSteps: scene.uiSteps,
    })

    if (sceneProps) {
      draft.sceneProps = sceneProps
    }

    return draft
  })
}

export function storyboardToSceneCreatePayload(scenes: StoryboardScene[]) {
  return scenes.map((s) => {
    const sceneProps =
      s.sceneProps ??
      buildScenePropsFromDirectorScene({
        purpose: s.purpose,
        componentType: s.componentType,
        duration: s.duration,
        title: s.visual.description.slice(0, 80),
        input: s.input,
        process: s.process,
        result: s.result,
        voiceover: s.audio.voiceover,
        uiSteps: s.uiSteps,
      })

    return {
      order: s.order,
      duration: s.duration,
      description: s.visual.description,
      visualPrompt: s.visual.prompt,
      voiceText: s.audio.voiceover,
      storyBeat: s.purpose,
      purpose: s.purpose,
      componentType: s.componentType,
      shotType: s.camera.shotType,
      cameraMotion: s.camera.movement,
      lighting: s.camera.lighting,
      transition: s.transition,
      viewerTask: s.viewerTask,
      inputDesc: s.input,
      processDesc: s.process,
      resultDesc: s.result,
      motionDescription: s.motion.description,
      soundEffect: s.audio.sfx?.[0],
      assetRequirement: s.assetRequirement,
      assetSource: s.assetRequirement.type === 'stock' ? 'pexels' : 'ai',
      cues: sceneProps ? { sceneProps } : undefined,
    }
  })
}

export function sortScenesByPurpose<T extends { purpose?: string | null; order: number }>(scenes: T[]) {
  return [...scenes].sort((a, b) => {
    const pa = PURPOSE_ORDER.indexOf(normalizePurpose(a.purpose ?? ''))
    const pb = PURPOSE_ORDER.indexOf(normalizePurpose(b.purpose ?? ''))
    if (pa !== pb) return (pa === -1 ? 99 : pa) - (pb === -1 ? 99 : pb)
    return a.order - b.order
  })
}

export const storyboardEngine = {
  buildStoryboardFromDirectorPlan,
  validateStoryboardScene,
  storyboardToSceneCreatePayload,
  sortScenesByPurpose,
}
