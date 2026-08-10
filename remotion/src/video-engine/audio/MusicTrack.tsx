import React from 'react'
import { Audio, interpolate, useCurrentFrame, useVideoConfig } from 'remotion'

export interface MusicTrackProps {
  src: string
  volume?: number
  voiceWindows?: Array<{ from: number; to: number }>
}

export const MusicTrack: React.FC<MusicTrackProps> = ({ src, volume = 0.22, voiceWindows = [] }) => {
  const frame = useCurrentFrame()
  const { fps, durationInFrames } = useVideoConfig()

  let ducked = volume
  for (const window of voiceWindows) {
    if (frame >= window.from && frame <= window.to) {
      ducked = Math.min(ducked, volume * 0.35)
    }
  }

  const fadeVolume = interpolate(
    frame,
    [0, fps, durationInFrames - fps, durationInFrames],
    [0, ducked, ducked, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  )

  return <Audio src={src} volume={fadeVolume} />
}
