/**
 * ShotPlanner — turns a single scene into a sequence of sub-shots.
 *
 * The key insight: a 10s scene showing one image with a slow zoom reads as
 * "AI PPT". The same 10s split into 3-4 sub-shots — each with a different
 * framing (establishing → medium → close), a different camera movement, and
 * a different focus point — reads as real camera language. The image is the
 * same, but the viewer perceives multiple angles.
 *
 * Sub-shots are planned deterministically from the scene's `shot` config +
 * duration + order, so the same VideoScene JSON always renders the same way.
 */

import type { ShotConfig } from '@xueai/shared'

export interface SubShot {
  /** 0-based index within the scene */
  index: number
  /** start frame, relative to scene start (0-based) */
  startFrame: number
  /** duration in frames */
  durationInFrames: number
  /** framing for this sub-shot */
  shotType: NonNullable<ShotConfig['type']>
  /** camera movement for this sub-shot */
  camera: NonNullable<ShotConfig['camera']>
  /** intensity 0-1 */
  intensity: number
  /** focus point in normalized [0,1] image space — where the camera homes in */
  focusPoint: { x: number; y: number }
  /** micro-transition INTO this sub-shot (from the previous one) */
  transitionIn: 'cut' | 'whip' | 'flash' | 'zoom_burst'
}

/** Target sub-shot length in seconds — scenes are split into chunks of ~2-3.5s. */
const MIN_SUBSHOT_SEC = 2
const MAX_SUBSHOT_SEC = 3.5

/** Framing progression patterns — each cycle through a scene. */
const FRAMING_PROGRESSIONS: NonNullable<ShotConfig['type']>[][] = [
  ['establishing', 'medium', 'close', 'detail'],
  ['wide', 'medium', 'close', 'macro'],
  ['medium', 'close', 'medium', 'close'],
  ['close', 'medium', 'wide', 'close'],
]

/** Camera movement cycles — varied per sub-shot to avoid monotony. */
const CAMERA_CYCLE: NonNullable<ShotConfig['camera']>[] = [
  'push_in',
  'pan_right',
  'pull_out',
  'orbit',
  'push_in',
  'pan_left',
  'parallax',
  'handheld',
]

/**
 * Deterministic pseudo-random in [0,1) from a seed — so plans are stable
 * across renders for the same scene id + order.
 */
function seeded(seed: number): number {
  const x = Math.sin(seed * 9999.7) * 43758.5453
  return x - Math.floor(x)
}

/** Focus points spread across the image to simulate different angles. */
const FOCUS_POINTS = [
  { x: 0.5, y: 0.45 },
  { x: 0.32, y: 0.4 },
  { x: 0.68, y: 0.42 },
  { x: 0.5, y: 0.62 },
  { x: 0.28, y: 0.55 },
  { x: 0.72, y: 0.58 },
]

/**
 * Plan sub-shots for a scene.
 *
 * @param shot the scene's ShotConfig (may be partial — defaults are filled in)
 * @param durationInFrames total scene duration in frames
 * @param fps composition fps
 * @param seedBase deterministic seed (scene order / id hash) for stable variety
 */
export function planSubShots(
  shot: ShotConfig | undefined,
  durationInFrames: number,
  fps: number,
  seedBase = 1,
): SubShot[] {
  if (durationInFrames <= 0) return []

  const baseType = shot?.type ?? 'medium'
  const baseCamera = shot?.camera ?? 'push_in'
  const intensity = shot?.intensity ?? 0.6

  // Decide number of sub-shots from duration: ~2.5-3s each, clamped to [1, 5].
  const targetSec = durationInFrames / fps
  let count = Math.round(targetSec / 2.8)
  count = Math.max(1, Math.min(5, count))
  // If only one sub-shot fits, still emit one (degrades gracefully to single shot).
  if (count === 1) {
    return [
      {
        index: 0,
        startFrame: 0,
        durationInFrames,
        shotType: baseType,
        camera: baseCamera,
        intensity,
        focusPoint: FOCUS_POINTS[0],
        transitionIn: 'cut',
      },
    ]
  }

  // Distribute frames across sub-shots as evenly as possible.
  const perShot = Math.floor(durationInFrames / count)
  const remainder = durationInFrames - perShot * count

  const progression = FRAMING_PROGRESSIONS[seedBase % FRAMING_PROGRESSIONS.length]

  const subShots: SubShot[] = []
  let cursor = 0
  for (let i = 0; i < count; i++) {
    const dur = perShot + (i < remainder ? 1 : 0)
    // Framing: first sub-shot uses the declared type, rest follow a progression
    // so the scene reads as a camera moving closer / across the subject.
    const shotType = i === 0 ? baseType : progression[(i + seedBase) % progression.length]
    // Camera: first uses declared, rest cycle through varied movements.
    const camera = i === 0 ? baseCamera : CAMERA_CYCLE[(i + seedBase) % CAMERA_CYCLE.length]
    // Focus point rotates through spread positions to simulate angle changes.
    const focusPoint = FOCUS_POINTS[(i + seedBase) % FOCUS_POINTS.length]
    // Micro-transition: first is always cut; ~1 in 4 gets a whip/flash for energy,
    // the rest are hard cuts (hard cuts between sub-shots feel cinematic).
    let transitionIn: SubShot['transitionIn'] = 'cut'
    if (i > 0) {
      const r = seeded(seedBase * 31 + i)
      if (r > 0.78) transitionIn = 'whip'
      else if (r > 0.68) transitionIn = 'flash'
      else if (r > 0.62) transitionIn = 'zoom_burst'
    }

    subShots.push({
      index: i,
      startFrame: cursor,
      durationInFrames: dur,
      shotType,
      camera,
      intensity,
      focusPoint,
      transitionIn,
    })
    cursor += dur
  }

  return subShots
}

/** Framing → base scale. Tighter framing starts more zoomed-in. */
export function framingBaseScale(shotType: string): number {
  switch (shotType) {
    case 'establishing':
      return 1.0
    case 'wide':
      return 1.05
    case 'medium':
      return 1.15
    case 'close':
      return 1.3
    case 'macro':
      return 1.55
    case 'detail':
      return 1.7
    default:
      return 1.1
  }
}

export const shotPlanner = {
  planSubShots,
  framingBaseScale,
}
