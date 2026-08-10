export { getMotionConfig, getEmotionTint, getCameraPreset } from '../video-engine/animations/camera-presets.js'

export function getShotLabel(scene: { shotType?: string; cameraMotion?: string }) {
  const shot = scene.shotType?.replace(/_/g, ' ') ?? 'medium'
  const motion = scene.cameraMotion?.replace(/_/g, ' ') ?? 'dolly in'
  return `${shot} · ${motion}`
}
