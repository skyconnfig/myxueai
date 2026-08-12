/**
 * AudioTimeline — the planning core of the Audio Engine.
 *
 * Pure logic (no React / Remotion deps). It consumes the composition's audio
 * config + scene timeline + declarative `audio` events and produces a unified
 * audio timeline the renderer consumes:
 *
 *   - voice segments (from scenes that have a voiceUrl)
 *   - SFX hits (resolved from `audio` events via the SFX library)
 *   - BGM ducking plan (voice windows + transient dips on impact/boom)
 *   - per-segment volume curves (attack / sustain / release envelopes)
 *
 * When a SFX sample URL is unavailable (no env var, no staticFile), the hit is
 * dropped gracefully — the engine never crashes on missing assets.
 */

import type { AudioEvent, VideoCompositionJSON, VideoScene } from '@xueai/shared'

/** A resolved SFX hit ready to render. */
export interface SfxHit {
  /** resolved sample URL (http/https/staticFile) */
  url: string
  /** start frame, composition-relative */
  startFrame: number
  /** duration in frames */
  durationInFrames: number
  /** base volume 0-1 */
  volume: number
  /** the declared type (for labeling) */
  type: string
  /** envelope: attack frames (fade-in) */
  attackFrames: number
  /** envelope: release frames (fade-out) */
  releaseFrames: number
}

/** A voice segment from a scene. */
export interface VoiceSegment {
  url: string
  startFrame: number
  durationInFrames: number
  volume: number
}

/** A BGM ducking segment — describes how BGM should behave in a time window. */
export interface BgmDuckSegment {
  from: number
  to: number
  /** whether voice is present in this window (drives main ducking) */
  hasVoice: boolean
  /** per-scene intensity hint */
  bgmIntensity?: string
  /** transient dip: a brief extra duck around an impact/boom SFX */
  transientDip?: { at: number; depth: number; width: number }
}

/** SFX library entry — maps a declared type to a sample + envelope defaults. */
export interface SfxLibraryEntry {
  /** env var name or staticFile path used to resolve the sample URL */
  source: string
  defaultVolume: number
  durationSec: number
  attackSec: number
  releaseSec: number
  /** whether this type also briefly dips the BGM (impact/boom) */
  dipsBgm?: boolean
  dipDepth?: number
  dipWidthSec?: number
}

/** The built-in SFX library. URLs resolve from env vars first, then staticFile. */
export const SFX_LIBRARY: Record<string, SfxLibraryEntry> = {
  whoosh: { source: 'SFX_WHOOSH_URL', defaultVolume: 0.5, durationSec: 0.5, attackSec: 0.04, releaseSec: 0.2 },
  transition: { source: 'SFX_WHOOSH_URL', defaultVolume: 0.45, durationSec: 0.5, attackSec: 0.04, releaseSec: 0.2 },
  impact: { source: 'SFX_IMPACT_URL', defaultVolume: 0.7, durationSec: 0.4, attackSec: 0.005, releaseSec: 0.25, dipsBgm: true, dipDepth: 0.5, dipWidthSec: 0.3 },
  boom: { source: 'SFX_IMPACT_URL', defaultVolume: 0.8, durationSec: 0.6, attackSec: 0.005, releaseSec: 0.4, dipsBgm: true, dipDepth: 0.6, dipWidthSec: 0.4 },
  riser: { source: 'SFX_RISER_URL', defaultVolume: 0.4, durationSec: 1.5, attackSec: 0.8, releaseSec: 0.1 },
  click: { source: 'SFX_CLICK_URL', defaultVolume: 0.4, durationSec: 0.15, attackSec: 0.005, releaseSec: 0.08 },
  sparkle: { source: 'SFX_SPARKLE_URL', defaultVolume: 0.3, durationSec: 0.6, attackSec: 0.05, releaseSec: 0.3 },
  sweep: { source: 'SFX_WHOOSH_URL', defaultVolume: 0.45, durationSec: 0.7, attackSec: 0.1, releaseSec: 0.3 },
}

/** Resolve a SFX library entry to a concrete URL, or null if unavailable. */
export function resolveSfxUrl(entry: SfxLibraryEntry, staticFile: (p: string) => string): string | null {
  // Read env safely — Remotion's webpack replaces process.env at bundle time.
  // We go through globalThis so the browser bundle doesn't need @types/node.
  const proc = (globalThis as Record<string, unknown>).process as
    | { env?: Record<string, string | undefined> }
    | undefined
  const env = proc?.env ?? {}
  const envVal = env[entry.source]
  if (envVal) return envVal
  // No env var: try a staticFile fallback only when an explicit override is
  // registered (see registerSfxSource). Otherwise return null so the renderer
  // drops the hit gracefully instead of crashing on a missing asset.
  const slug = entry.source.replace('SFX_', '').replace('_URL', '').toLowerCase()
  const staticPath = registeredSfxSources.get(slug)
  return staticPath ? staticFile(staticPath) : null
}

/** Register a SFX sample path so resolveSfxUrl can fall back to staticFile. */
const registeredSfxSources = new Map<string, string>()
export function registerSfxSource(slug: string, staticPath: string): void {
  registeredSfxSources.set(slug, staticPath)
}

/** The full audio timeline ready for the renderer. */
export interface AudioTimeline {
  voice: VoiceSegment[]
  sfx: SfxHit[]
  bgmDuck: BgmDuckSegment[]
  /** composition-level fade in/out frames for BGM */
  bgmFade: { fadeInFrames: number; fadeOutFrames: number }
}

/**
 * Build the audio timeline from a composition.
 *
 * @param composition the VideoCompositionJSON
 * @param sceneTimeline per-scene frame ranges: [{ fromFrame, toFrame, scene }]
 * @param fps composition fps
 * @param staticFile Remotion's staticFile resolver (for SFX fallback)
 */
export function buildAudioTimeline(
  composition: VideoCompositionJSON,
  sceneTimeline: Array<{ fromFrame: number; toFrame: number; scene: VideoScene }>,
  fps: number,
  staticFileFn: (p: string) => string,
): AudioTimeline {
  // Voice segments from scenes.
  const voice: VoiceSegment[] = []
  for (const entry of sceneTimeline) {
    const voiceUrl = entry.scene.audio?.voiceUrl
    if (voiceUrl) {
      voice.push({
        url: voiceUrl,
        startFrame: entry.fromFrame,
        durationInFrames: entry.toFrame - entry.fromFrame,
        volume: entry.scene.audio?.voiceVolume ?? 1,
      })
    }
  }

  // SFX hits from declarative audio events.
  const sfx: SfxHit[] = []
  const transientDips: BgmDuckSegment['transientDip'][] = []
  const events = composition.audio?.audio ?? []
  for (const ev of events) {
    const lib = SFX_LIBRARY[ev.type]
    if (!lib) continue // unknown type — skip gracefully
    const url = resolveSfxUrl(lib, staticFileFn)
    if (!url) continue // sample unavailable — skip gracefully
    const startFrame = Math.max(0, Math.round(ev.time * fps))
    const durationInFrames = Math.max(1, Math.round(lib.durationSec * fps))
    sfx.push({
      url,
      startFrame,
      durationInFrames,
      volume: ev.volume ?? lib.defaultVolume,
      type: ev.type,
      attackFrames: Math.max(1, Math.round(lib.attackSec * fps)),
      releaseFrames: Math.max(1, Math.round(lib.releaseSec * fps)),
    })
    if (lib.dipsBgm) {
      transientDips.push({
        at: startFrame,
        depth: lib.dipDepth ?? 0.5,
        width: Math.round((lib.dipWidthSec ?? 0.3) * fps),
      })
    }
  }

  // BGM ducking plan from voice windows (per scene) + transient dips.
  const bgmDuck: BgmDuckSegment[] = sceneTimeline.map((entry) => ({
    from: entry.fromFrame,
    to: entry.toFrame,
    hasVoice: Boolean(entry.scene.audio?.voiceUrl),
    bgmIntensity: entry.scene.audio?.bgmIntensity,
  }))
  // Attach the first transient dip to the matching segment for the renderer.
  if (transientDips.length > 0) {
    const dip = transientDips[0]
    if (dip) {
      const seg = bgmDuck.find((s) => dip.at >= s.from && dip.at <= s.to)
      if (seg) seg.transientDip = dip
    }
  }

  const fadeInFrames = Math.round(fps * 1)
  const fadeOutFrames = Math.round(fps * 1)

  return { voice, sfx, bgmDuck, bgmFade: { fadeInFrames, fadeOutFrames } }
}

/** BGM volume multiplier for a given intensity when voice is present. */
export function intensityDuckMultiplier(intensity?: string): number {
  switch (intensity) {
    case 'silent': return 0.0
    case 'low': return 0.25
    case 'medium': return 0.4
    case 'high': return 0.55
    case 'swell': return 0.6
    default: return 0.35
  }
}

export const audioTimeline = {
  buildAudioTimeline,
  resolveSfxUrl,
  intensityDuckMultiplier,
  SFX_LIBRARY,
}
