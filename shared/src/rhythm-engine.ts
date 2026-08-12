/**
 * Rhythm Engine — derives per-scene pacing intent from storyBeat, emotion and
 * TTS duration. Produces a bgmIntensity hint and a relative cut-speed multiplier
 * that the composition builder / Remotion can consume.
 *
 * This is intentionally lightweight (no ML): it encodes a few cinematic
 * heuristics so the BGM ducking and shot rhythm track the narrative energy
 * instead of staying flat across the whole video.
 */

import type { BgmIntensity } from './director-types.js'

export interface RhythmIntent {
  /** suggested BGM ducking intensity for this scene */
  bgmIntensity: BgmIntensity
  /** relative cut speed multiplier (1 = normal, >1 = faster cuts, <1 = linger) */
  cutSpeed: number
  /** energy level 0-1 for this beat (used for BGM swell decisions) */
  energy: number
}

const BEAT_ENERGY: Record<string, number> = {
  hook: 0.85,
  pain: 0.55,
  problem: 0.55,
  context: 0.4,
  insight: 0.7,
  solution: 0.65,
  demo: 0.6,
  result: 0.8,
  cta: 0.95,
}

const EMOTION_ENERGY: Record<string, number> = {
  stress: 0.6,
  urgency: 0.85,
  confidence: 0.7,
  success: 0.85,
  relief: 0.45,
  calm: 0.3,
  curiosity: 0.65,
}

/**
 * Compute rhythm intent for a scene.
 *
 * @param storyBeat hook/pain/solution/result/cta/etc.
 * @param emotion stress/confidence/success/relief/urgency/calm/curiosity
 * @param durationSec scene's TTS duration
 */
export function computeRhythmIntent(input: {
  storyBeat?: string | null
  emotion?: string | null
  durationSec: number
}): RhythmIntent {
  const beat = (input.storyBeat ?? '').toLowerCase()
  const emotion = (input.emotion ?? '').toLowerCase()

  const beatEnergy = BEAT_ENERGY[beat] ?? 0.5
  const emotionEnergy = EMOTION_ENERGY[emotion] ?? 0.5
  // Blend: beat drives structure, emotion modulates within it.
  let energy = beatEnergy * 0.65 + emotionEnergy * 0.35

  // Short scenes read as punchy/high-energy; long scenes as lingering.
  if (input.durationSec <= 3) energy = Math.min(1, energy + 0.12)
  else if (input.durationSec >= 10) energy = Math.max(0, energy - 0.1)

  // Map energy → bgmIntensity
  let bgmIntensity: BgmIntensity = 'medium'
  if (beat === 'cta') bgmIntensity = 'swell'
  else if (beat === 'hook') bgmIntensity = 'high'
  else if (energy >= 0.8) bgmIntensity = 'high'
  else if (energy >= 0.55) bgmIntensity = 'medium'
  else if (energy >= 0.35) bgmIntensity = 'low'
  else bgmIntensity = 'low'

  // Cut speed: higher energy → faster cuts; calm/relief → linger.
  const cutSpeed = 0.7 + energy * 0.8

  return { bgmIntensity, cutSpeed, energy: Math.round(energy * 100) / 100 }
}
