import React from 'react'
import { Audio } from 'remotion'

export interface VoiceTrackProps {
  src: string
  volume?: number
}

export const VoiceTrack: React.FC<VoiceTrackProps> = ({ src, volume = 1 }) => {
  if (!src) return null
  return <Audio src={src} volume={volume} />
}
