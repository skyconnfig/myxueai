import React, { useMemo } from 'react'
import { AbsoluteFill } from 'remotion'
import { TransitionSeries } from '@remotion/transitions'
import type { VideoCompositionJSON } from '@xueai/shared'
import { calculateCompositionFrames } from '@xueai/shared'
import { CompositionAudio } from '../audio/CompositionAudio.js'
import { AudioEngine } from '../audio/AudioEngine.js'
import { buildDuckingPlan } from '../audio/ducking.js'
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

  const duckingPlan = useMemo(
    () =>
      buildDuckingPlan(
        timeline.map((entry) => ({
          fromFrame: entry.fromFrame,
          toFrame: entry.toFrame,
          hasVoice: Boolean(entry.scene.audio?.voiceUrl),
          bgmIntensity: entry.scene.audio?.bgmIntensity,
        })),
      ),
    [timeline],
  )

  const elements: React.ReactNode[] = []
  timeline.forEach((entry, index) => {
    const isLast = index === timeline.length - 1
    const transition = entry.scene.transition ?? (index === 0 ? 'cut' : 'cut')

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
          presentation={getTransitionPresentation(transition, { width: composition.width, height: composition.height }) as never}
          timing={getTransitionTiming(transition)}
        />,
      )
    }
  })

  const hasSceneVoice = timeline.some((entry) => Boolean(entry.scene.audio?.voiceUrl))
  const hasDeclarativeSfx = Boolean(composition.audio?.audio?.length)
  const useAudioEngine = hasSceneVoice || hasDeclarativeSfx

  return (
    <AbsoluteFill style={{ backgroundColor: '#05070A' }}>
      {useAudioEngine ? (
        <AudioEngine composition={composition} sceneTimeline={timeline} />
      ) : (
        <CompositionAudio audio={composition.audio} duckingPlan={duckingPlan} />
      )}
      <TransitionSeries>{elements}</TransitionSeries>
    </AbsoluteFill>
  )
}

export { secToFrames }
