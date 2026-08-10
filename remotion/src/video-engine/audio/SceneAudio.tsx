import React from 'react'
import { Audio, Sequence, staticFile, useVideoConfig } from 'remotion'
import type { VideoScene } from '@xueai/shared'
import { secToFrames } from '../core/TimelineEngine.js'

function resolveSrc(src?: string) {
  if (!src) return null
  if (src.startsWith('http://') || src.startsWith('https://')) return src
  if (src.startsWith('renders/')) return staticFile(src)
  return staticFile(src)
}

export interface SceneAudioProps {
  scene: VideoScene
}

export const SceneAudio: React.FC<SceneAudioProps> = ({ scene }) => {
  const { fps } = useVideoConfig()
  const voiceSrc = resolveSrc(scene.audio?.voiceUrl)

  return (
    <>
      {voiceSrc ? <Audio src={voiceSrc} volume={scene.audio?.voiceVolume ?? 1} /> : null}
      {scene.audio?.sfx?.map((sfx, index) => (
        <Sequence
          key={`scene-sfx-${index}-${sfx.label ?? 'sfx'}`}
          from={secToFrames(sfx.atSec, fps)}
          durationInFrames={secToFrames(0.5, fps)}
        >
          <Audio src={resolveSrc(sfx.url)!} volume={sfx.volume ?? 0.6} />
        </Sequence>
      ))}
    </>
  )
}
