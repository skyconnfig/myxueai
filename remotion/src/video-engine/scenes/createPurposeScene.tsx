import React from 'react'
import type { VideoScene } from '@xueai/shared'
import { applyPurposePreset } from '../registry/purpose-registry.js'
import { registerSceneComponent, resolveSceneComponentOrFallback } from '../registry/scene-registry.js'
import type { SceneComponentProps } from '../registry/types.js'

export function createPurposeScene(purpose: string): React.FC<SceneComponentProps> {
  return function PurposeSceneWrapper({ scene, durationInFrames }) {
    const enriched = applyPurposePreset({ ...scene, purpose: scene.purpose ?? purpose })
    const entry = resolveSceneComponentOrFallback(String(enriched.component))
    const Component = entry.component
    return <Component scene={enriched} durationInFrames={durationInFrames} />
  }
}

export const HookScene = createPurposeScene('hook')
export const ProblemScene = createPurposeScene('problem')
export const ProductScene = createPurposeScene('demo')
export const FeatureScene = createPurposeScene('solution')
export const ResultScene = createPurposeScene('result')
export const CTAScene = createPurposeScene('cta')

export function registerPurposeScenes() {
  registerSceneComponent('HookScene', { component: HookScene, skipCameraWrap: true })
  registerSceneComponent('ProblemScene', { component: ProblemScene, skipCameraWrap: true })
  registerSceneComponent('ProductScene', { component: ProductScene, skipCameraWrap: true })
  registerSceneComponent('FeatureScene', { component: FeatureScene, skipCameraWrap: true })
  registerSceneComponent('ResultScene', { component: ResultScene, skipCameraWrap: true })
  registerSceneComponent('CTA', { component: CTAScene, skipCameraWrap: true })
}
