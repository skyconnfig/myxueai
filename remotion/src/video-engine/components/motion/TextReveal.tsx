import React from 'react'
import { interpolate, useCurrentFrame } from 'remotion'
import { designTokens } from '../../design-system/tokens.js'

export interface TextRevealProps {
  text: string
  startFrame?: number
  charsPerFrame?: number
}

export const TextReveal: React.FC<TextRevealProps> = ({
  text,
  startFrame = 0,
  charsPerFrame = 0.8,
}) => {
  const frame = useCurrentFrame()
  const localFrame = Math.max(0, frame - startFrame)
  const visibleChars = Math.min(text.length, Math.floor(localFrame * charsPerFrame))
  const shown = text.slice(0, visibleChars)
  const cursorBlink = Math.floor(frame / 15) % 2 === 0

  return (
    <span style={{ color: designTokens.colors.muted, fontSize: 16, lineHeight: 1.6 }}>
      {shown}
      {visibleChars < text.length && cursorBlink ? '|' : ''}
    </span>
  )
}
