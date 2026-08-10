import React from 'react'
import { Sequence, useVideoConfig } from 'remotion'
import type { VideoScene } from '@xueai/shared'
import { designTokens } from '../design-system/tokens.js'
import { cuesToFrameRanges, parseSubtitleCues } from './subtitle-timing.js'

export interface SubtitleTrackProps {
  scene: VideoScene
  cues?: unknown
}

export const SubtitleTrack: React.FC<SubtitleTrackProps> = ({ scene, cues }) => {
  const { fps } = useVideoConfig()
  const parsed = parseSubtitleCues(cues ?? scene.props?.subtitleCues ?? [])
  const ranges = cuesToFrameRanges(parsed, 0, fps)

  return (
    <>
      {ranges.map((range, index) => (
        <Sequence key={`sub-${index}`} from={range.from} durationInFrames={Math.max(1, range.to - range.from)}>
          <div
            style={{
              position: 'absolute',
              bottom: 100,
              left: 0,
              right: 0,
              textAlign: 'center',
              color: designTokens.colors.text,
              fontSize: 34,
              fontWeight: 700,
              fontFamily: designTokens.fonts.sans,
              textShadow: '0 4px 24px rgba(0,0,0,0.85)',
              padding: '0 64px',
            }}
          >
            {range.text}
          </div>
        </Sequence>
      ))}
    </>
  )
}
