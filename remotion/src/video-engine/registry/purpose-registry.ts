import type { VideoScene } from '@xueai/shared'

import {

  buildDefaultCTAProps,

  buildDefaultDashboardProps,

  buildDefaultProductDemoSteps,

  normalizeComponentName,

} from '@xueai/shared'



export interface PurposePreset {

  component: string

  camera?: VideoScene['camera']

  animation?: VideoScene['animation']

  mergeProps?: (scene: VideoScene) => Record<string, unknown>

}



const PURPOSE_PRESETS: Record<string, PurposePreset> = {

  hook: {

    component: 'CinematicFallback',

    camera: { type: 'push_in', shotType: 'close_up', speed: 0.4 },

    animation: { enter: 'fade', primary: 'ken-burns' },

  },

  problem: {

    component: 'CinematicFallback',

    camera: { type: 'tracking', shotType: 'wide', speed: 0.5 },

    animation: { enter: 'fade', primary: 'video-broll' },

  },

  solution: {

    component: 'BrowserWindow',

    camera: { type: 'push_in', shotType: 'medium', speed: 0.45 },

    animation: { enter: 'spring', primary: 'browser-reveal' },

    mergeProps: (scene) => ({

      title: scene.caption?.text?.slice(0, 80) ?? 'Product',

      url: 'app.demo',

      body: scene.meta?.action,

      theme: 'dark',

    }),

  },

  demo: {

    component: 'ProductDemo',

    camera: { type: 'push_in', shotType: 'over_shoulder', speed: 0.5 },

    animation: { enter: 'spring', primary: 'ui-interaction' },

    mergeProps: (scene) => ({

      title: scene.caption?.text?.slice(0, 80) ?? 'Product Demo',

      url: 'app.demo/dashboard',

      steps: buildDefaultProductDemoSteps({

        process: scene.meta?.action,

        result: scene.caption?.text,

        duration: scene.duration,

      }),

      theme: 'dark',

    }),

  },

  result: {

    component: 'DashboardAnimation',

    camera: { type: 'orbit', shotType: 'wide', speed: 0.35 },

    animation: { enter: 'spring', primary: 'data-counter' },

    mergeProps: (scene) =>

      buildDefaultDashboardProps({

        title: scene.caption?.text?.slice(0, 80) ?? 'Results',

        result: scene.meta?.action,

      }) as unknown as Record<string, unknown>,

  },

  cta: {

    component: 'CTA',

    camera: { type: 'static', shotType: 'medium' },

    animation: { enter: 'spring', primary: 'cta-pulse' },

    mergeProps: (scene) =>

      buildDefaultCTAProps({

        headline: scene.caption?.text?.slice(0, 80) ?? 'Get started',

        subline: scene.meta?.action,

      }) as unknown as Record<string, unknown>,

  },

}



export function resolvePurposePreset(purpose?: string): PurposePreset | null {

  if (!purpose) return null

  const key = purpose.toLowerCase()

  return PURPOSE_PRESETS[key] ?? null

}



function isGenericCinematicComponent(component?: string | null): boolean {

  if (!component) return true

  const normalized = normalizeComponentName(component)

  return normalized === 'CinematicFallback'

}



export function applyPurposePreset(scene: VideoScene): VideoScene {

  const preset = resolvePurposePreset(scene.purpose)

  if (!preset) return scene



  const component =

    scene.component && !isGenericCinematicComponent(scene.component)

      ? scene.component

      : preset.component



  const mergedProps =

    preset.mergeProps && (!scene.props || Object.keys(scene.props).length === 0)

      ? preset.mergeProps(scene)

      : scene.props



  return {

    ...scene,

    component: normalizeComponentName(component),

    camera: { ...preset.camera, ...scene.camera },

    animation: { ...preset.animation, ...scene.animation },

    props: mergedProps ? { ...mergedProps, ...scene.props } : scene.props,

  }

}



export function listPurposePresets(): string[] {

  return Object.keys(PURPOSE_PRESETS)

}

