/**
 * subShots — multi-phase camera framing within a Product Demo scene.
 */

import { interpolate } from 'remotion'

export type SubShotCamera = 'wide' | 'medium' | 'close' | 'detail'

export interface ProductDemoSubShot {
  start: number
  duration: number
  camera: SubShotCamera
}

export const DEFAULT_SUB_SHOTS: ProductDemoSubShot[] = [
  { start: 0, duration: 1.5, camera: 'wide' },
  { start: 1.5, duration: 1.5, camera: 'medium' },
  { start: 3.0, duration: 4.5, camera: 'close' },
  { start: 7.5, duration: 1.5, camera: 'detail' },
  { start: 9.0, duration: 1.0, camera: 'detail' },
]

export interface SubShotTransform {
  scale: number
  translateX: number
  translateY: number
  rotateY: number
  blur: number
  focusX: number
  focusY: number
}

const CAMERA_PRESETS: Record<SubShotCamera, SubShotTransform> = {
  wide: { scale: 0.82, translateX: 0, translateY: 48, rotateY: 4, blur: 0, focusX: 0.5, focusY: 0.5 },
  medium: { scale: 0.95, translateX: 0, translateY: 12, rotateY: 2, blur: 0, focusX: 0.5, focusY: 0.48 },
  close: { scale: 1.05, translateX: 0, translateY: 0, rotateY: 0, blur: 0, focusX: 0.5, focusY: 0.45 },
  detail: { scale: 1.28, translateX: -40, translateY: -20, rotateY: -1, blur: 3, focusX: 0.62, focusY: 0.38 },
}

function lerpTransform(a: SubShotTransform, b: SubShotTransform, t: number): SubShotTransform {
  return {
    scale: interpolate(t, [0, 1], [a.scale, b.scale]),
    translateX: interpolate(t, [0, 1], [a.translateX, b.translateX]),
    translateY: interpolate(t, [0, 1], [a.translateY, b.translateY]),
    rotateY: interpolate(t, [0, 1], [a.rotateY, b.rotateY]),
    blur: interpolate(t, [0, 1], [a.blur, b.blur]),
    focusX: interpolate(t, [0, 1], [a.focusX, b.focusX]),
    focusY: interpolate(t, [0, 1], [a.focusY, b.focusY]),
  }
}

export function getSubShotAtTime(
  timeSec: number,
  subShots: ProductDemoSubShot[] = DEFAULT_SUB_SHOTS,
): SubShotTransform {
  const sorted = [...subShots].sort((a, b) => a.start - b.start)

  for (let i = 0; i < sorted.length; i++) {
    const shot = sorted[i]
    const end = shot.start + shot.duration
    if (timeSec >= shot.start && timeSec < end) {
      const preset = CAMERA_PRESETS[shot.camera]
      const localT = (timeSec - shot.start) / Math.max(shot.duration, 0.001)
      const next = sorted[i + 1]
      if (next && localT > 0.75 && timeSec > end - 0.35) {
        const blend = (localT - 0.75) / 0.25
        const nextPreset = CAMERA_PRESETS[next.camera]
        return lerpTransform(preset, nextPreset, Math.min(1, blend))
      }
      return preset
    }
  }

  const last = sorted[sorted.length - 1]
  return CAMERA_PRESETS[last?.camera ?? 'medium']
}
