import type { DirectorPlan, StoryboardScene } from '../director-plan.js'
import { buildDefaultBeforeAfterProps } from '../scene-props/before-after.js'
import type { BrowserWindowProps } from '../scene-props/browser-window.js'
import { buildDefaultCTAProps } from '../scene-props/cta.js'
import { buildDefaultDashboardProps } from '../scene-props/dashboard.js'
import { buildDefaultFeatureRevealProps } from '../scene-props/feature-reveal.js'
import { buildDefaultProductDemoSteps } from '../scene-props/product-demo.js'
import type { ProductDemoProps } from '../scene-props/product-demo.js'
import { normalizeUiSteps } from '../scene-props/ui-step.js'
import type { VideoCompositionJSON } from '../video-composition.js'
import type { VideoScene } from '../video-scene.js'
import {
  normalizeCameraType,
  normalizeComponentName,
} from '../video-scene.js'

export interface DirectorSceneInput {
  purpose?: string
  componentType?: string
  duration: number
  title?: string
  input?: string
  process?: string
  result?: string
  voiceover?: string
  uiSteps?: unknown
  sceneProps?: Record<string, unknown>
}

export function buildScenePropsFromDirectorScene(
  scene: DirectorSceneInput,
): Record<string, unknown> | undefined {
  if (scene.sceneProps && Object.keys(scene.sceneProps).length > 0) {
    return scene.sceneProps
  }

  const component = normalizeComponentName(scene.componentType)
  const title = (scene.title ?? scene.voiceover ?? 'Scene').slice(0, 80)
  const defaultSteps = buildDefaultProductDemoSteps({
    process: scene.process,
    result: scene.result ?? scene.voiceover,
    duration: scene.duration,
  })
  const steps = scene.uiSteps
    ? normalizeUiSteps(scene.uiSteps, scene.duration, defaultSteps)
    : undefined

  if (component === 'ProductDemo' || scene.purpose === 'demo') {
    const props: ProductDemoProps = {
      title,
      subtitle: scene.process,
      url: 'app.demo/dashboard',
      steps: steps ?? defaultSteps,
      theme: 'dark',
    }
    return props as unknown as Record<string, unknown>
  }

  if (component === 'BrowserWindow' || scene.purpose === 'solution') {
    const props: BrowserWindowProps = {
      title,
      url: 'app.demo',
      body: scene.process,
      steps: (steps ?? defaultSteps).slice(0, 3),
      theme: 'dark',
    }
    return props as unknown as Record<string, unknown>
  }

  if (component === 'DashboardAnimation' || scene.purpose === 'result') {
    return buildDefaultDashboardProps({ title, result: scene.result }) as unknown as Record<string, unknown>
  }

  if (component === 'FeatureReveal') {
    return buildDefaultFeatureRevealProps({
      headline: title,
      process: scene.process,
      result: scene.result,
    }) as unknown as Record<string, unknown>
  }

  if (component === 'BeforeAfter') {
    return buildDefaultBeforeAfterProps({
      beforeText: scene.input ?? scene.process,
      afterText: scene.result,
    }) as unknown as Record<string, unknown>
  }

  if (component === 'CTA' || scene.purpose === 'cta') {
    return buildDefaultCTAProps({
      headline: scene.voiceover?.slice(0, 80) ?? title,
      subline: scene.result,
    }) as unknown as Record<string, unknown>
  }

  return undefined
}

export function storyboardSceneToDirectorInput(scene: StoryboardScene): DirectorSceneInput {
  return {
    purpose: scene.purpose,
    componentType: scene.componentType,
    duration: scene.duration,
    title: scene.visual.description.slice(0, 80),
    input: scene.input,
    process: scene.process,
    result: scene.result,
    voiceover: scene.audio.voiceover,
    uiSteps: scene.uiSteps,
    sceneProps: scene.sceneProps,
  }
}

export function adaptStoryboardToVideoScenes(scenes: StoryboardScene[]): VideoScene[] {
  return scenes.map((scene) => {
    const props = buildScenePropsFromDirectorScene(storyboardSceneToDirectorInput(scene))
    return {
      id: `scene-${scene.order}`,
      order: scene.order,
      purpose: scene.purpose,
      component: normalizeComponentName(scene.componentType),
      duration: scene.duration,
      transition: scene.transition as VideoScene['transition'],
      camera: {
        shotType: scene.camera.shotType,
        type: normalizeCameraType(scene.camera.movement),
        lighting: scene.camera.lighting,
      },
      animation: {
        primary: scene.motion.pattern,
        enter: 'spring',
        springPreset: 'smooth',
      },
      caption: { text: scene.audio.voiceover },
      audio: scene.audio.sfx?.[0]
        ? { sfx: [{ url: scene.audio.sfx[0], atSec: 0, label: 'scene-sfx' }] }
        : undefined,
      props,
      meta: {
        storyBeat: scene.purpose,
        viewerTask: scene.viewerTask,
      },
    }
  })
}

export function adaptDirectorPlanToCompositionJSON(
  plan: DirectorPlan,
  storyboard: StoryboardScene[],
  meta?: VideoCompositionJSON['meta'],
): VideoCompositionJSON {
  const scenes = adaptStoryboardToVideoScenes(storyboard)
  return {
    meta: meta ?? {
      id: plan.title,
      title: plan.title,
      version: 1,
    },
    fps: 30,
    width: 1920,
    height: 1080,
    ratio: '16:9',
    duration: scenes.reduce((sum, s) => sum + s.duration, 0),
    scenes,
  }
}
