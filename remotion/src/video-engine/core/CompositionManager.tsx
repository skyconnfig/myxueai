import React, { useMemo } from 'react'
import { AbsoluteFill } from 'remotion'
import { TransitionSeries } from '@remotion/transitions'
import type { VideoCompositionJSON } from '@xueai/shared'
import { calculateCompositionFrames } from '@xueai/shared'
import { CompositionAudio } from '../audio/CompositionAudio.js'
import { buildVoiceWindowsFromComposition } from '../audio/ducking.js'
import { getTransitionPresentation, getTransitionTiming } from './TransitionEngine.js'
import { buildSceneTimeline, secToFrames } from './TimelineEngine.js'
import { SceneRenderer } from './SceneRenderer.js'

export interface CompositionManagerProps {
  composition: VideoCompositionJSON
}

export function calculateCompositionMetadata(composition: VideoCompositionJSON) {
  return {
    durationInFrames: calculateCompositionFrames(composition),
    fps: composition.fps,
    width: composition.width,
    height: composition.height,
  }
}

export const CompositionManager: React.FC<CompositionManagerProps> = ({ composition }) => {
  const timeline = useMemo(() => buildSceneTimeline(composition), [composition])

  const voiceWindows = useMemo(
    () =>
      buildVoiceWindowsFromComposition(
        timeline.map((entry) => ({
          fromFrame: entry.fromFrame,
          toFrame: entry.toFrame,
          hasVoice: Boolean(entry.scene.audio?.voiceUrl),
        })),
      ),
    [timeline],
  )

  const elements: React.ReactNode[] = []
  timeline.forEach((entry, index) => {
    const isLast = index === timeline.length - 1
    const transition = entry.scene.transition ?? (index === 0 ? 'cut' : 'crossfade')

    elements.push(
      <TransitionSeries.Sequence
        key={`scene-${entry.scene.id}`}
        durationInFrames={entry.durationInFrames}
      >
        <SceneRenderer
          scene={entry.scene}
          durationInFrames={entry.durationInFrames}
          composition={composition}
          sceneIndex={index}
        />
      </TransitionSeries.Sequence>,
    )

    if (!isLast) {
      elements.push(
        <TransitionSeries.Transition
          key={`transition-${entry.scene.id}`}
          presentation={getTransitionPresentation(transition)}
          timing={getTransitionTiming(transition)}
        />,
      )
    }
  })

  return (
    <AbsoluteFill style={{ backgroundColor: '#05070A' }}>
      <CompositionAudio audio={composition.audio} voiceWindows={voiceWindows} />
      <TransitionSeries>{elements}</TransitionSeries>
    </AbsoluteFill>
  )
}

export { secToFrames }
