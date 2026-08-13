import React from 'react'
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion'
import { designTokens } from '../design-system/tokens.js'

export interface CursorTrailProps {
  x: number
  y: number
  visible: boolean
}

export const CursorTrail: React.FC<CursorTrailProps> = ({ x, y, visible }) => {
  if (!visible) return null
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const dots = [0, 3, 6].map((offset) => ({
    opacity: interpolate(offset, [0, 6], [0.5, 0.08]),
    scale: interpolate(offset, [0, 6], [1, 0.5]),
  }))

  return (
    <>
      {dots.map((d, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: `${x * 100}%`,
            top: `${y * 100}%`,
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: designTokens.colors.accentBlue,
            transform: `translate(calc(-50% - ${i * 4}px), calc(-50% - ${i * 3}px)) scale(${d.scale})`,
            opacity: d.opacity * (0.6 + Math.sin((frame / fps) * 4) * 0.1),
            zIndex: 18,
          }}
        />
      ))}
    </>
  )
}

export interface ClickRippleProps {
  x: number
  y: number
  atFrame: number
}

export const ClickRipple: React.FC<ClickRippleProps> = ({ x, y, atFrame }) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const local = frame - atFrame
  if (local < 0 || local > fps * 0.5) return null

  const expand = spring({ frame: local, fps, config: designTokens.spring.snappy })
  const size = interpolate(expand, [0, 1], [12, 56])
  const opacity = interpolate(expand, [0, 1], [0.85, 0])

  return (
    <>
      <div
        style={{
          position: 'absolute',
          left: `${x * 100}%`,
          top: `${y * 100}%`,
          width: size,
          height: size,
          borderRadius: '50%',
          border: `2px solid ${designTokens.colors.accentBlue}`,
          transform: 'translate(-50%, -50%)',
          opacity,
          zIndex: 21,
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: `${x * 100}%`,
          top: `${y * 100}%`,
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: designTokens.colors.accent,
          transform: 'translate(-50%, -50%)',
          opacity: interpolate(local, [0, 6], [1, 0.3]),
          zIndex: 22,
        }}
      />
    </>
  )
}

export interface SimulatorCursorProps {
  x: number
  y: number
  clicking: boolean
}

export const SimulatorCursor: React.FC<SimulatorCursorProps> = ({ x, y, clicking }) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const press = clicking ? 0.85 : 1
  const pulse = clicking
    ? spring({ frame: frame % 10, fps, config: designTokens.spring.snappy })
    : 0

  return (
    <div
      style={{
        position: 'absolute',
        left: `${x * 100}%`,
        top: `${y * 100}%`,
        transform: `translate(-2px, -2px) scale(${press})`,
        zIndex: 25,
        pointerEvents: 'none',
      }}
    >
      <svg width="22" height="26" viewBox="0 0 22 26" fill="none">
        <path
          d="M4 2L4 20L9 15L13 24L16 22L12 13L19 12L4 2Z"
          fill="#FFFFFF"
          stroke="#111827"
          strokeWidth="1.5"
        />
      </svg>
      {clicking ? (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: 20,
            height: 20,
            borderRadius: '50%',
            border: `2px solid ${designTokens.colors.accent}`,
            transform: `scale(${1 + pulse * 0.8})`,
            opacity: 1 - pulse * 0.7,
          }}
        />
      ) : null}
    </div>
  )
}

export const Spotlight: React.FC<{
  x: number
  y: number
  radius?: number
  active: boolean
}> = ({ x, y, radius = 80, active }) => {
  if (!active) return null
  return (
    <div
      style={{
        position: 'absolute',
        left: `${x * 100}%`,
        top: `${y * 100}%`,
        width: radius * 2,
        height: radius * 2,
        borderRadius: '50%',
        transform: 'translate(-50%, -50%)',
        boxShadow: `0 0 0 9999px rgba(5,7,10,0.45), 0 0 40px ${designTokens.colors.accent}66`,
        border: `2px solid ${designTokens.colors.accentBlue}88`,
        zIndex: 15,
        pointerEvents: 'none',
      }}
    />
  )
}
