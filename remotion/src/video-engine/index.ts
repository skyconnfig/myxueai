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

// Shot Engine — multi-sub-shot cinematography driven by VideoScene.shot
export { shotPlanner, planSubShots, framingBaseScale } from './shot/ShotPlanner.js'
export type { SubShot } from './shot/ShotPlanner.js'
export { cameraMovement, computeCameraMovement } from './shot/CameraMovement.js'
export type { CameraTransform } from './shot/CameraMovement.js'
export { ShotTransition, shotTransitionDuration } from './shot/ShotTransition.js'
export { ShotDirector } from './shot/ShotDirector.js'

// Caption Engine 2.0 — kinetic typography driven by VideoScene.caption
export { captionEngine, segmentCaption, buildCaptionPlan } from './subtitles/CaptionEngine.js'
export type { CaptionToken, PlannedCue, CaptionPlan, CaptionAnimationType } from './subtitles/CaptionEngine.js'
export { captionStyles, CAPTION_PRESETS, resolveCaptionStyle } from './subtitles/CaptionStyles.js'
export type { CaptionPreset, CaptionStylePreset } from './subtitles/CaptionStyles.js'
export { CaptionRenderer } from './subtitles/CaptionRenderer.js'

// Audio Engine — declarative audio events + BGM ducking + volume curves
export { audioTimeline, buildAudioTimeline, resolveSfxUrl, intensityDuckMultiplier, SFX_LIBRARY } from './audio/AudioTimeline.js'
export type { SfxHit, VoiceSegment, BgmDuckSegment, AudioTimeline as AudioTimelineType, SfxLibraryEntry } from './audio/AudioTimeline.js'
export { AudioEngine } from './audio/AudioEngine.js'

import { registerPurposeScenes } from './scenes/createPurposeScene.js'
registerPurposeScenes()
