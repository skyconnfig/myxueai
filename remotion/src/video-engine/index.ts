export {
  CompositionManager,
  calculateCompositionMetadata,
} from './core/CompositionManager.js'
export { SceneRenderer } from './core/SceneRenderer.js'
export { timelineEngine, secToFrames, buildSceneTimeline } from './core/TimelineEngine.js'
export { transitionEngine } from './core/TransitionEngine.js'
export { adaptRenderInput, adaptRenderScene } from './adapters/render-input.adapter'
export {
  compositionToRenderInput,
  mergeRenderInputWithComposition,
} from './adapters/legacy-bridge.js'
export {
  registerSceneComponent,
  resolveSceneComponent,
  resolveSceneComponentOrFallback,
  listRegisteredComponents,
} from './registry/scene-registry.js'
export {
  resolvePurposePreset,
  applyPurposePreset,
  listPurposePresets,
} from './registry/purpose-registry.js'
export { checkRenderInputVisual, summarizeQc } from './qc/check-visual.js'
export { checkCompositionVisual } from './qc/check-scene-props.js'
export { checkCompositionAudio } from './qc/check-audio.js'
export type { SceneComponentProps, RegistryEntry } from './registry/types.js'

import { registerPurposeScenes } from './scenes/createPurposeScene.js'
registerPurposeScenes()
