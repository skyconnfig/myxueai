/**
 * AudioEngine — the unified audio renderer for the composition.
 *
 * Renders three layers with volume curves:
 *   1. BGM — with smooth ducking when voice is present (attack/release envelope)
 *      plus transient dips on impact/boom SFX
 *   2. Voice — one <Audio> per scene's voiceUrl, at scene volume
 *   3. SFX — each declarative audio event rendered as a <Sequence> with its
 *      own attack/sustain/release envelope so hits punch through the mix
 *
 * Driven entirely by the AudioTimeline (built from composition JSON), so the
 * `audio` event array controls SFX placement with no code changes.
 */

import React, { useMemo } from 'react'
import { Audio, interpolate, Sequence, staticFile, useCurrentFrame, useVideoConfig } from 'remotion'
import type { VideoCompositionJSON } from '@xueai/shared'
import {
  buildAudioTimeline,
  intensityDuckMultiplier,
  type AudioTimeline as AudioTimelineType,
} from './AudioTimeline.js'

function resolveAudioSrc(url: string): string {
  if (url.startsWith('http://') || url.startsWith('https://')) return url
  return staticFile(url.startsWith('/') ? url.slice(1) : url)
}

/** Compute the BGM volume at the current frame from the ducking plan. */
function computeBgmVolume(
  frame: number,
  fps: number,
  durationInFrames: number,
  baseVolume: number,
  duck: AudioTimelineType['bgmDuck'],
  fade: AudioTimelineType['bgmFade'],
): number {
  const attackFrames = Math.max(2, Math.round(fps * 0.15))
  const releaseFrames = Math.max(3, Math.round(fps * 0.3))

  // Find the active segment and compute ducked target.
  let duckedTarget = baseVolume
  for (const seg of duck) {
    if (frame >= seg.from && frame <= seg.to) {
      if (seg.hasVoice) {
        const mult = intensityDuckMultiplier(seg.bgmIntensity)
        duckedTarget = Math.min(duckedTarget, baseVolume * mult)
      }
    }
  }

  // Smooth attack/release around voice-window boundaries.
  let smoothVolume = duckedTarget
  for (const seg of duck) {
    if (!seg.hasVoice) continue
    const enterDist = frame - seg.from
    const exitDist = seg.to - frame
    if (enterDist >= 0 && enterDist < attackFrames) {
      const t = enterDist / attackFrames
      smoothVolume = Math.min(smoothVolume, interpolate(t, [0, 1], [baseVolume, duckedTarget]))
    }
    if (exitDist >= 0 && exitDist < releaseFrames) {
      const t = 1 - exitDist / releaseFrames
      smoothVolume = Math.min(smoothVolume, interpolate(t, [0, 1], [baseVolume, duckedTarget]))
    }
  }

  // Transient dip on impact/boom: a brief extra duck around the SFX hit.
  for (const seg of duck) {
    const dip = seg.transientDip
    if (!dip) continue
    const dist = Math.abs(frame - dip.at)
    if (dist < dip.width) {
      const t = 1 - dist / dip.width
      smoothVolume = smoothVolume * (1 - dip.depth * t)
    }
  }

  // Composition-level fade in/out.
  const fadeVolume = interpolate(
    frame,
    [0, fade.fadeInFrames, durationInFrames - fade.fadeOutFrames, durationInFrames],
    [0, smoothVolume, smoothVolume, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  )
  return fadeVolume
}

/** Compute a SFX envelope volume at a given frame within the hit. */
function computeSfxVolume(
  localFrame: number,
  durationInFrames: number,
  attackFrames: number,
  releaseFrames: number,
  baseVolume: number,
): number {
  if (localFrame < 0 || localFrame >= durationInFrames) return 0
  const attack = interpolate(localFrame, [0, attackFrames], [0, baseVolume], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
  const release = interpolate(
    localFrame,
    [durationInFrames - releaseFrames, durationInFrames],
    [baseVolume, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  )
  return Math.min(attack, release)
}

export interface AudioEngineProps {
  composition: VideoCompositionJSON
  sceneTimeline: Array<{ fromFrame: number; toFrame: number; scene: VideoCompositionJSON['scenes'][number] }>
}

export const AudioEngine: React.FC<AudioEngineProps> = ({ composition, sceneTimeline }) => {
  const frame = useCurrentFrame()
  const { fps, durationInFrames } = useVideoConfig()

  const timeline = useMemo(
    () => buildAudioTimeline(composition, sceneTimeline, fps, staticFile),
    [composition, sceneTimeline, fps],
  )

  const bgmUrl = composition.audio?.backgroundMusic?.url
  const bgmBaseVolume = composition.audio?.backgroundMusic?.volume ?? 0.22

  const bgmVolume = bgmUrl
    ? computeBgmVolume(frame, fps, durationInFrames, bgmBaseVolume, timeline.bgmDuck, timeline.bgmFade)
    : 0

  return (
    <>
      {/* BGM layer with ducking curve */}
      {bgmUrl ? <Audio src={resolveAudioSrc(bgmUrl)} volume={bgmVolume} /> : null}

      {/* Voice layer — one Audio per scene */}
      {timeline.voice.map((v, i) => (
        <Sequence
          key={`voice-${i}`}
          from={v.startFrame}
          durationInFrames={v.durationInFrames}
        >
          <Audio src={resolveAudioSrc(v.url)} volume={v.volume} />
        </Sequence>
      ))}

      {/* SFX layer — declarative audio events with envelopes */}
      {timeline.sfx.map((hit, i) => {
        const localFrame = frame - hit.startFrame
        const vol = computeSfxVolume(
          localFrame,
          hit.durationInFrames,
          hit.attackFrames,
          hit.releaseFrames,
          hit.volume,
        )
        return (
          <Sequence
            key={`sfx-${i}-${hit.type}`}
            from={hit.startFrame}
            durationInFrames={hit.durationInFrames}
          >
            <Audio src={resolveAudioSrc(hit.url)} volume={vol} />
          </Sequence>
        )
      })}
    </>
  )
}
