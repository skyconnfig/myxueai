import React from 'react'

import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion'

import type { UiStep } from '@xueai/shared'

import { designTokens } from '../../design-system/tokens.js'
import { resolveStepKeyframes } from '../../product-demo/TargetResolver.js'

export interface CursorProps {
  steps: UiStep[]
  durationInFrames: number
}

function getCursorPosition(steps: UiStep[], frame: number, fps: number, durationInFrames: number) {
  const timeSec = frame / fps
  const durationSec = durationInFrames / fps
  const keyframes = resolveStepKeyframes(steps, durationSec)

  let x = 0.5
  let y = 0.5
  for (let i = 0; i < keyframes.length - 1; i++) {
    const a = keyframes[i]
    const b = keyframes[i + 1]
    if (timeSec >= a.at && timeSec <= b.at) {
      const span = b.at - a.at
      const t = span <= 0 ? 1 : (timeSec - a.at) / span
      const eased = 1 - (1 - t) ** 3
      x = interpolate(eased, [0, 1], [a.x, b.x], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
      y = interpolate(eased, [0, 1], [a.y, b.y], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
      break
    }
  }

  const clicking = steps.some(
    (step) => step.action === 'click' && timeSec >= step.at && timeSec - step.at < 0.25,
  )

  return { x, y, clicking }
}

export const Cursor: React.FC<CursorProps> = ({ steps, durationInFrames }) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const { x, y, clicking } = getCursorPosition(steps, frame, fps, durationInFrames)
  const pulse = spring({ frame: clicking ? frame % 8 : 0, fps, config: designTokens.spring.snappy })

  return (
    <>
      <div
        style={{
          position: 'absolute',
          left: `${x * 100}%`,
          top: `${y * 100}%`,
          width: 18,
          height: 18,
          borderRadius: '50%',
          background: '#fff',
          border: '2px solid #111',
          transform: 'translate(-50%, -50%)',
          boxShadow: '0 4px 12px rgba(0,0,0,0.35)',
          zIndex: 20,
          transition: 'none',
        }}
      />
      {clicking ? (
        <div
          style={{
            position: 'absolute',
            left: `${x * 100}%`,
            top: `${y * 100}%`,
            width: 48,
            height: 48,
            borderRadius: '50%',
            border: '2px solid rgba(99,102,241,0.8)',
            transform: `translate(-50%, -50%) scale(${interpolate(pulse, [0, 1], [0.4, 1.2])})`,
            opacity: interpolate(pulse, [0, 1], [0.9, 0]),
            zIndex: 19,
          }}
        />
      ) : null}
    </>
  )
}
