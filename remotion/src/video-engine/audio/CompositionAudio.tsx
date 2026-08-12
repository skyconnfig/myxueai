import React from 'react'
import { Audio, interpolate, Sequence, staticFile, useCurrentFrame, useVideoConfig } from 'remotion'
import type { CompositionAudioConfig } from '@xueai/shared'
import { intensityDuckMultiplier, type DuckingSegment } from './ducking.js'

function resolveAudioSrc(url: string) {
  if (url.startsWith('http://') || url.startsWith('https://')) return url
  return staticFile(url.startsWith('/') ? url.slice(1) : url)
}

export interface CompositionAudioProps {
  audio?: CompositionAudioConfig
  duckingPlan: DuckingSegment[]
}

/**
 * BGM renderer with per-scene ducking. When voice is present, BGM ducks to a
 * level determined by the scene's bgmIntensity, with a short attack/release
 * envelope so the dip is smooth rather than a hard step.
 */
export const CompositionAudio: React.FC<CompositionAudioProps> = ({ audio, duckingPlan }) => {
  const frame = useCurrentFrame()
  const { fps, durationInFrames } = useVideoConfig()

  const baseVolume = audio?.backgroundMusic?.volume ?? 0.22
  const attackFrames = Math.max(2, Math.round(fps * 0.15))
  const releaseFrames = Math.max(3, Math.round(fps * 0.3))

  // Find the active segment for the current frame and compute ducked target.
  let duckedTarget = baseVolume
  for (const seg of duckingPlan) {
    if (frame >= seg.from && frame <= seg.to) {
      if (seg.hasVoice) {
        const mult = intensityDuckMultiplier(seg.bgmIntensity)
        duckedTarget = Math.min(duckedTarget, baseVolume * mult)
      }
    }
  }

  // Smooth attack/release around voice-window boundaries: detect distance to
  // the nearest voice on/off edge and ramp accordingly.
  let smoothVolume = duckedTarget
  for (const seg of duckingPlan) {
    if (!seg.hasVoice) continue
    const enterDist = frame - seg.from
    const exitDist = seg.to - frame
    // Attack: ramp from base down to ducked over attackFrames at voice start
    if (enterDist >= 0 && enterDist < attackFrames) {
      const t = enterDist / attackFrames
      const fromVol = baseVolume
      smoothVolume = Math.min(smoothVolume, interpolate(t, [0, 1], [fromVol, duckedTarget]))
    }
    // Release: ramp from ducked up to base over releaseFrames at voice end
    if (exitDist >= 0 && exitDist < releaseFrames) {
      const t = 1 - exitDist / releaseFrames
      smoothVolume = Math.min(smoothVolume, interpolate(t, [0, 1], [baseVolume, duckedTarget]))
    }
  }

  // Composition-level fade in/out
  const fadeVolume = interpolate(
    frame,
    [0, fps, durationInFrames - fps, durationInFrames],
    [0, smoothVolume, smoothVolume, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  )

  return (
    <>
      {audio?.backgroundMusic?.url ? (
        <Audio src={resolveAudioSrc(audio.backgroundMusic.url)} volume={fadeVolume} />
      ) : null}
      {audio?.soundEffects?.map((sfx, index) => (
        <Sequence
          key={`${sfx.label ?? 'sfx'}-${index}`}
          from={sfx.startFrame}
          durationInFrames={sfx.durationInFrames}
        >
          <Audio src={resolveAudioSrc(sfx.url)} volume={sfx.volume} />
        </Sequence>
      ))}
    </>
  )
}
