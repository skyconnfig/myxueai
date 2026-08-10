import type { VideoScene } from '@xueai/shared'
import { BeforeAfter } from '../components/commercial/BeforeAfter.js'
import { BrowserWindow } from '../components/commercial/BrowserWindow.js'
import { CTA } from '../components/commercial/CTA.js'
import { DashboardAnimation } from '../components/commercial/DashboardAnimation.js'
import { FeatureReveal } from '../components/commercial/FeatureReveal.js'
import { ProductDemo } from '../components/commercial/ProductDemo.js'
import { CinematicFallbackScene } from '../scenes/CinematicFallbackScene.js'
import type { RegistryEntry, SceneComponent } from './types.js'

const REGISTRY = new Map<string, RegistryEntry>()

function registerDefaults() {
  const entries: Record<string, RegistryEntry> = {
    CinematicFallback: { component: CinematicFallbackScene, skipCameraWrap: true },
    cinematic_still: { component: CinematicFallbackScene, skipCameraWrap: true },
    broll_video: { component: CinematicFallbackScene, skipCameraWrap: true },
    ProductDemo: {
      component: ProductDemo,
      defaultCamera: { type: 'push_in', speed: 0.5 },
      propsSchema: 'ProductDemoProps',
      skipCameraWrap: true,
    },
    product_demo: { component: ProductDemo, skipCameraWrap: true },
    BrowserWindow: {
      component: BrowserWindow,
      defaultCamera: { type: 'push_in', speed: 0.4 },
      propsSchema: 'BrowserWindowProps',
      skipCameraWrap: true,
    },
    browser_window: { component: BrowserWindow, skipCameraWrap: true },
    ui_demo: { component: BrowserWindow, skipCameraWrap: true },
    DashboardAnimation: {
      component: DashboardAnimation,
      defaultCamera: { type: 'orbit', speed: 0.35 },
      propsSchema: 'DashboardAnimationProps',
      skipCameraWrap: true,
    },
    FeatureReveal: {
      component: FeatureReveal,
      defaultCamera: { type: 'push_in', speed: 0.45 },
      propsSchema: 'FeatureRevealProps',
      skipCameraWrap: true,
    },
    BeforeAfter: {
      component: BeforeAfter,
      defaultCamera: { type: 'static' },
      propsSchema: 'BeforeAfterProps',
      skipCameraWrap: true,
    },
    CTA: {
      component: CTA,
      defaultCamera: { type: 'static' },
      propsSchema: 'CTAProps',
      skipCameraWrap: true,
    },
  }

  for (const [name, entry] of Object.entries(entries)) {
    REGISTRY.set(name, entry)
  }
}

registerDefaults()

export function registerSceneComponent(name: string, entry: RegistryEntry) {
  REGISTRY.set(name, entry)
}

export function resolveSceneComponent(name?: string): RegistryEntry | null {
  if (!name) return REGISTRY.get('CinematicFallback') ?? null
  return REGISTRY.get(name) ?? null
}

export function resolveSceneComponentOrFallback(name?: string): RegistryEntry {
  return resolveSceneComponent(name) ?? REGISTRY.get('CinematicFallback')!
}

export function listRegisteredComponents(): string[] {
  return [...REGISTRY.keys()]
}

/** @deprecated use RegistryEntry.component with VideoScene props */
export function resolveLegacySceneComponent(componentType?: string): SceneComponent | null {
  const entry = resolveSceneComponent(componentType)
  return entry?.component ?? null
}
