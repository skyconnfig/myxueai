import React from 'react'
import { Audio } from 'remotion'

export interface SoundEffectProps {
  src: string
  volume?: number
}

export const SoundEffect: React.FC<SoundEffectProps> = ({ src, volume = 0.6 }) => {
  return <Audio src={src} volume={volume} />
}
