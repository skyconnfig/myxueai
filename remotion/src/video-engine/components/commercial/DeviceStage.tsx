/**
 * DeviceStage — a cinematic device stage for Product Demo v2.
 *
 * Renders a browser and/or phone mockup with 3D perspective tilt, parallax
 * depth and a screen glow, so product demos look like a real commercial hero
 * shot instead of a flat centered card. The stage applies a continuous camera
 * move (push_in + slight orbit) driven by the Shot Engine's `shot` config when
 * present, giving the device real cinematic language.
 */

import React from 'react'
import { interpolate, useCurrentFrame, useVideoConfig } from 'remotion'
import type { ShotConfig } from '@xueai/shared'
import { designTokens } from '../../design-system/tokens.js'
import { BrowserMockup } from '../mockups/BrowserMockup.js'
import { PhoneMockup } from '../mockups/PhoneMockup.js'

export type DeviceKind = 'browser' | 'phone' | 'both'

export interface DeviceStageProps {
  device?: DeviceKind
  url?: string
  theme?: 'dark' | 'light'
  /** shot config drives the continuous camera move on the stage */
  shot?: ShotConfig
  /** 0-1 progress through the scene — used to drive the push_in intensity */
  progress?: number
  /** entrance amount 0-1 (spring) for the hero fly-in */
  enter?: number
  /** zoom-into-screen amount 0-1 — scales the inner screen content up */
  screenZoom?: number
  children?: React.ReactNode
  /** content rendered inside the primary device screen */
  screenContent?: React.ReactNode
}

export const DeviceStage: React.FC<DeviceStageProps> = ({
  device = 'browser',
  url = 'app.demo',
  theme = 'dark',
  shot,
  progress = 0,
  enter = 1,
  screenZoom = 0,
  screenContent,
  children,
}) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  // Continuous cinematic camera move on the device.
  const cameraType = shot?.camera ?? 'push_in'
  const intensity = shot?.intensity ?? 0.6
  const speed = shot?.speed ?? 0.5

  // push_in: scale up slightly + drift toward viewer over the scene.
  const pushScale = interpolate(progress, [0, 1], [1, 1 + 0.12 * intensity], {
    extrapolateRight: 'clamp',
  })
  // orbit: slow rotateY for parallax depth (subtle, never > 8deg).
  const orbitDeg =
    cameraType === 'orbit'
      ? Math.sin((frame / fps) * speed * 1.5) * 6 * intensity
      : cameraType === 'parallax'
        ? interpolate(progress, [0, 1], [-4, 4]) * intensity
        : interpolate(progress, [0, 1], [0, 2]) * intensity
  // handheld: micro-shake.
  const shakeX =
    cameraType === 'handheld'
      ? Math.sin((frame / fps) * 7.3) * 3 * intensity
      : 0
  const shakeY =
    cameraType === 'handheld'
      ? Math.cos((frame / fps) * 6.1) * 2.5 * intensity
      : 0

  // Hero entrance: fly in from below with a 3D tilt that settles to face.
  const enterScale = interpolate(enter, [0, 1], [0.82, 1])
  const enterY = interpolate(enter, [0, 1], [80, 0])
  const enterTilt = interpolate(enter, [0, 1], [16, 0])

  const stageTransform = `translateY(${enterY + shakeY}px) translateX(${shakeX}px) scale(${enterScale * pushScale}) rotateY(${orbitDeg + enterTilt}deg)`

  const glowOpacity = interpolate(enter, [0, 1], [0, 0.55]) * (0.7 + 0.3 * Math.sin(progress * Math.PI))

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        perspective: 1400,
      }}
    >
      {/* Ambient screen glow behind the device */}
      <div
        style={{
          position: 'absolute',
          width: '60%',
          height: '50%',
          borderRadius: '50%',
          background: `radial-gradient(circle, ${designTokens.colors.accent}88 0%, transparent 70%)`,
          filter: 'blur(60px)',
          opacity: glowOpacity,
          transform: 'translateZ(-200px)',
        }}
      />

      <div
        style={{
          transform: stageTransform,
          transformStyle: 'preserve-3d',
          transformOrigin: 'center center',
          display: 'flex',
          gap: 28,
          alignItems: 'center',
          width: '100%',
          justifyContent: 'center',
        }}
      >
        {(device === 'browser' || device === 'both') && (
          <div
            style={{
              width: device === 'both' ? '62%' : '78%',
              transform: `scale(${1 + screenZoom * 0.35})`,
              transformOrigin: 'center top',
              transition: 'transform 0.2s',
            }}
          >
            <BrowserMockup url={url} theme={theme}>
              <div style={{ position: 'relative', minHeight: 360 }}>{screenContent ?? children}</div>
            </BrowserMockup>
          </div>
        )}

        {(device === 'phone' || device === 'both') && (
          <div
            style={{
              width: device === 'both' ? '26%' : '34%',
              transform: `scale(${1 + screenZoom * 0.25})`,
              transformOrigin: 'center top',
              zIndex: 2,
            }}
          >
            <PhoneMockup theme={theme}>{screenContent ?? children}</PhoneMockup>
          </div>
        )}
      </div>
    </div>
  )
}
