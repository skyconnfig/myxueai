import React from 'react'
import { Sequence, useVideoConfig } from 'remotion'
import type { VideoScene } from '@xueai/shared'
import { designTokens } from '../design-system/tokens.js'
import { cuesToFrameRanges, parseSubtitleCues } from './subtitle-timing.js'

export interface SubtitleTrackProps {
  scene: VideoScene
  cues?: unknown
}

/** Split text into segments, marking which ones are highlighted/emphasized. */
function renderTextWithHighlights(text: string, highlightWords?: string[]) {
  if (!highlightWords || highlightWords.length === 0) return text
  // Build a regex that matches any highlight word; escape regex specials
  const escaped = highlightWords
    .map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .filter((w) => w.length > 0)
  if (escaped.length === 0) return text
  const re = new RegExp(`(${escaped.join('|')})`, 'g')
  const parts = text.split(re)
  return parts.map((part, i) => {
    if (highlightWords.includes(part)) {
      return (
        <span key={i} style={{ color: designTokens.colors.accent ?? '#FBBF24', fontWeight: 800 }}>
          {part}
        </span>
      )
    }
    return <React.Fragment key={i}>{part}</React.Fragment>
  })
}

export const SubtitleTrack: React.FC<SubtitleTrackProps> = ({ scene, cues }) => {
  const { fps } = useVideoConfig()
  const parsed = parseSubtitleCues(cues ?? scene.props?.subtitleCues ?? [])
  const ranges = cuesToFrameRanges(parsed, 0, fps)
  const highlightWords = scene.caption?.highlightWords
  const fontSize = scene.caption?.style?.fontSize ?? 36
  const color = scene.caption?.style?.color ?? designTokens.colors.text ?? '#ffffff'
  const fontFamily = scene.caption?.style?.font ?? designTokens.fonts.sans

  return (
    <>
      {ranges.map((range, index) => (
        <Sequence key={`sub-${index}`} from={range.from} durationInFrames={Math.max(1, range.to - range.from)}>
          <div
            style={{
              position: 'absolute',
              bottom: 96,
              left: 0,
              right: 0,
              textAlign: 'center',
              color,
              fontSize,
              fontWeight: 700,
              fontFamily,
              textShadow: '0 4px 24px rgba(0,0,0,0.9), 0 2px 8px rgba(0,0,0,0.8)',
              padding: '0 56px',
              lineHeight: 1.35,
              letterSpacing: '0.02em',
            }}
          >
            {renderTextWithHighlights(range.text, range.highlightWords ?? highlightWords)}
          </div>
        </Sequence>
      ))}
    </>
  )
}
