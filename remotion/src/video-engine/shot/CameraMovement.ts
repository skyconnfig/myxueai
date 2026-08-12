/**
 * CameraMovement — per-frame camera transform for a sub-shot.
 *
 * Unlike the legacy camera-presets (pure 2D scale+translate on center), this
 * engine produces:
 *  - focus-point zooming (push_in homes toward an off-center subject, not the
 *    geometric center — this alone kills the "always-centered Ken Burns" feel)
 *  - orbit rotation (slight arc + roll, reads as a circling camera)
 *  - handheld micro-shake (layered sin waves, reads as a real handheld shot)
 *  - layered parallax (foreground/background move at different rates, reads
 *    as depth rather than a flat image pan)
 *
 * All output is a single transform applied to the image layer; the layered
 * parallax is expressed via scale + translate deltas the renderer can split
 * across two stacked copies of the image when it wants true depth.
 */

import { framingBaseScale, type SubShot } from './ShotPlanner.js'

export interface CameraTransform {
  scale: number
  translateX: number
  translateY: number
  /** degrees — small roll for orbit/handheld */
  rotate: number
  /** parallax split: foreground shift delta (added on top of translate) */
  parallaxFg: { x: number; y: number }
  /** opacity hint for a subtle vignette pulse during handheld (0 = none) */
  shakeVignette: number
}

/**
 * Compute the camera transform for a given sub-shot at a given frame.
 *
 * @param sub the active sub-shot
 * @param frame frame **within the sub-shot** (0-based)
 * @param fps composition fps
 */
export function computeCameraMovement(
  sub: SubShot,
  frame: number,
  fps: number,
): CameraTransform {
  const dur = Math.max(1, sub.durationInFrames)
  const progress = frame / Math.max(dur - 1, 1) // 0..1 within the sub-shot
  const intensity = sub.intensity
  const fp = sub.focusPoint
  // Convert normalized focus point to pixel offsets at the image plane.
  // We offset the image so the focus point sits at screen center, then scale.
  const focusOffsetX = (0.5 - fp.x) * 100 * intensity
  const focusOffsetY = (0.5 - fp.y) * 100 * intensity
  const baseScale = framingBaseScale(sub.shotType)

  let scale = baseScale
  let translateX = focusOffsetX
  let translateY = focusOffsetY
  let rotate = 0
  let parallaxFg = { x: 0, y: 0 }
  let shakeVignette = 0

  const t = fps > 0 ? frame / fps : 0 // seconds within sub-shot

  switch (sub.camera) {
    case 'push_in': {
      // Zoom from slightly-wide into the focus point.
      const zoom = 0.12 * intensity
      scale = baseScale + progress * zoom
      translateX = focusOffsetX * (0.6 + 0.4 * progress)
      translateY = focusOffsetY * (0.6 + 0.4 * progress)
      break
    }
    case 'pull_out': {
      // Zoom out from the focus point to a wider framing.
      const zoom = 0.14 * intensity
      scale = baseScale + (1 - progress) * zoom
      translateX = focusOffsetX * (1 - 0.5 * progress)
      translateY = focusOffsetY * (1 - 0.5 * progress)
      break
    }
    case 'pan_left': {
      // Drift left; keep focus point as the pan anchor.
      scale = baseScale + 0.04 * intensity
      translateX = focusOffsetX + (0.5 - progress) * 60 * intensity
      translateY = focusOffsetY
      break
    }
    case 'pan_right': {
      scale = baseScale + 0.04 * intensity
      translateX = focusOffsetX + (progress - 0.5) * 60 * intensity
      translateY = focusOffsetY
      break
    }
    case 'orbit': {
      // Arc: translate along X with a slight roll — reads as a circling camera.
      scale = baseScale + 0.06 * intensity
      translateX = focusOffsetX + Math.sin(progress * Math.PI) * 50 * intensity
      translateY = focusOffsetY + Math.sin(progress * Math.PI) * 14 * intensity
      rotate = Math.sin(progress * Math.PI) * 1.8 * intensity
      break
    }
    case 'handheld': {
      // Layered sin shake on top of a slow push — reads as real handheld.
      const slowPush = 0.05 * intensity * progress
      scale = baseScale + slowPush
      const shakeX =
        Math.sin(t * 7.3) * 6 * intensity + Math.sin(t * 13.1 + 1.2) * 3 * intensity
      const shakeY =
        Math.cos(t * 6.1) * 5 * intensity + Math.cos(t * 11.7 + 0.7) * 2.5 * intensity
      translateX = focusOffsetX + shakeX
      translateY = focusOffsetY + shakeY
      rotate = Math.sin(t * 4.5) * 0.6 * intensity
      shakeVignette = 0.1 * intensity
      break
    }
    case 'parallax': {
      // Foreground drifts faster than background — depth feel from one image.
      scale = baseScale + 0.05 * intensity + progress * 0.06 * intensity
      translateX = focusOffsetX + (progress - 0.5) * 40 * intensity
      translateY = focusOffsetY + (progress - 0.5) * 12 * intensity
      parallaxFg = {
        x: (progress - 0.5) * 80 * intensity,
        y: (progress - 0.5) * 24 * intensity,
      }
      break
    }
    default: {
      // static / unknown — hold the framing with a tiny breathing scale.
      scale = baseScale + Math.sin(progress * Math.PI) * 0.01 * intensity
      translateX = focusOffsetX
      translateY = focusOffsetY
    }
  }

  return { scale, translateX, translateY, rotate, parallaxFg, shakeVignette }
}

export const cameraMovement = {
  computeCameraMovement,
}
