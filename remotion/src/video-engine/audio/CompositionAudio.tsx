import React from 'react'
import { Audio, interpolate, Sequence, useCurrentFrame, useVideoConfig } from 'remotion'
import type { CompositionAudioConfig } from '@xueai/shared'

function resolveAudioSrc(url: string) {
  if (url.startsWith('http://') || url.startsWith('https://')) return url
  return url
}

export interface CompositionAudioProps {
  audio?: CompositionAudioConfig
  voiceWindows: Array<{ from: number; to: number }>
}

export const CompositionAudio: React.FC<CompositionAudioProps> = ({ audio, voiceWindows }) => {
  const frame = useCurrentFrame()
  const { fps, durationInFrames } = useVideoConfig()

  const baseVolume = audio?.backgroundMusic?.volume ?? 0.22
  let duckedVolume = baseVolume

  for (const window of voiceWindows) {
    if (frame >= window.from && frame <= window.to) {
      duckedVolume = Math.min(duckedVolume, baseVolume * 0.35)
    }
  }

  const fadeVolume = interpolate(
    frame,
    [0, fps, durationInFrames - fps, durationInFrames],
    [0, duckedVolume, duckedVolume, 0],
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
