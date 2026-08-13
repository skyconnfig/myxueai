/**
 * FeatureCallout — a numbered spotlight callout for Product Demo v2.
 *
 * Highlights a region of the device screen with a pulsing circle + a numbered
 * badge + a label line, the way real product commercials annotate UI features.
 * Callouts appear sequentially (driven by `appearAt` frame) with a spring pop.
 */

import React from 'react'
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion'
import { designTokens } from '../../design-system/tokens.js'

export interface FeatureCalloutItem {
  /** 1-based index shown in the badge */
  index: number
  /** normalized 0-1 position on the screen area */
  x: number
  y: number
  /** short label drawn beside the badge */
  label: string
  /** frame at which this callout appears */
  appearAt: number
  /** frames to hold visible (default ~1s) */
  holdFrames?: number
  /** frames to fade out (default ~0.3s) */
  exitFrames?: number
}

export interface FeatureCalloutProps {
  items: FeatureCalloutItem[]
  /** radius of the spotlight circle in px */
  radius?: number
}

export const FeatureCallout: React.FC<FeatureCalloutProps> = ({ items, radius = 46 }) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
      {items.map((item) => {
        const holdFrames = item.holdFrames ?? Math.round(fps * 1.0)
        const exitFrames = item.exitFrames ?? Math.round(fps * 0.3)
        const enterFrames = Math.round(fps * 0.4)
        const local = frame - item.appearAt

        const pop = spring({
          frame: local,
          fps,
          config: designTokens.spring.snappy,
          durationInFrames: enterFrames,
        })

        const exitStart = enterFrames + holdFrames
        const exitProgress =
          local > exitStart
            ? interpolate(local, [exitStart, exitStart + exitFrames], [1, 0], {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
              })
            : 1

        if (local < 0 || exitProgress <= 0.01) return null

        const pulse = 1 + Math.sin((frame / fps) * Math.PI * 2 * 1.2) * 0.06
        const left = `${item.x * 100}%`
        const top = `${item.y * 100}%`

        return (
          <div
            key={item.index}
            style={{
              position: 'absolute',
              left,
              top,
              transform: `translate(-50%, -50%) scale(${pop * pulse})`,
              opacity: pop * exitProgress,
            }}
          >
            {/* Spotlight ring */}
            <div
              style={{
                width: radius * 2,
                height: radius * 2,
                borderRadius: '50%',
                border: `2px solid ${designTokens.colors.accentBlue}`,
                boxShadow: `0 0 24px ${designTokens.colors.accentBlue}aa, inset 0 0 18px ${designTokens.colors.accentBlue}55`,
                background: `${designTokens.colors.accentBlue}10`,
              }}
            />
            {/* Numbered badge */}
            <div
              style={{
                position: 'absolute',
                top: -10,
                left: -10,
                width: 28,
                height: 28,
                borderRadius: '50%',
                background: `linear-gradient(135deg, ${designTokens.colors.accent}, ${designTokens.colors.accentBlue})`,
                color: '#fff',
                fontSize: 14,
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 6px 16px rgba(99,102,241,0.5)',
                fontFamily: designTokens.fonts.sans,
              }}
            >
              {item.index}
            </div>
            {/* Label line + text */}
            <div
              style={{
                position: 'absolute',
                top: radius - 6,
                left: radius + 6,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                whiteSpace: 'nowrap',
              }}
            >
              <div
                style={{
                  width: 28,
                  height: 2,
                  background: designTokens.colors.accentBlue,
                }}
              />
              <div
                style={{
                  fontSize: 15,
                  fontWeight: 700,
                  color: designTokens.colors.text,
                  background: 'rgba(5,7,10,0.72)',
                  padding: '4px 10px',
                  borderRadius: 6,
                  border: `1px solid ${designTokens.colors.border}`,
                  fontFamily: designTokens.fonts.sans,
                }}
              >
                {item.label}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
