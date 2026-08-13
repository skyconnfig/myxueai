/**
 * ProductDemoSimulator — interactive SaaS product demo (no screenshot overlay).
 * Driven by uiSteps + currentFrame; uses TargetResolver + subShots camera.
 */

import React, { useMemo } from 'react'
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion'
import type { ProductDemoV2Props, UiStep, VideoScene } from '@xueai/shared'
import { designTokens } from '../design-system/tokens.js'
import { BrowserFrame, BrowserToolbar } from './BrowserFrame.js'
import { PageTransition } from './PageTransition.js'
import { ClickRipple, CursorTrail, SimulatorCursor, Spotlight } from './CursorEffects.js'
import { DataCounter } from './Dashboard.js'
import { computeSimulatorState } from './simulatorState.js'
import { resolveCaptionPlacement, placementStyle } from './SafeAreaResolver.js'
import { DEFAULT_SUB_SHOTS, getSubShotAtTime, type ProductDemoSubShot } from './subShots.js'
import { resolveTarget } from './TargetResolver.js'

export interface ProductDemoSimulatorProps {
  scene: VideoScene
  props: ProductDemoV2Props
  durationInFrames: number
  subShots?: ProductDemoSubShot[]
  initialData?: number
}

export const ProductDemoSimulator: React.FC<ProductDemoSimulatorProps> = ({
  scene,
  props,
  durationInFrames,
  subShots = DEFAULT_SUB_SHOTS,
  initialData = 479_000,
}) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const timeSec = frame / fps
  const durationSec = durationInFrames / fps
  const progress = Math.min(1, frame / Math.max(1, durationInFrames))

  const steps: UiStep[] = props.steps ?? []
  const state = useMemo(
    () => computeSimulatorState(timeSec, steps, durationSec, initialData),
    [timeSec, steps, durationSec, initialData],
  )

  const camera = getSubShotAtTime(timeSec, subShots)

  // Establishing phase: office bg visible 0–1.5s
  const establishing = interpolate(timeSec, [0, 1.5], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
  const browserReveal = interpolate(timeSec, [0.8, 2.2], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  const buttonPulse = state.clicking ? 1 : interpolate(
    Math.abs(state.cursor.x - 0.72) + Math.abs(state.cursor.y - 0.26),
    [0, 0.3],
    [1, 0],
    { extrapolateRight: 'clamp' },
  )

  const showCursor = timeSec >= 2.8
  const showCTA = timeSec >= durationSec * 0.9
  const detailPhase = timeSec >= 7.5

  const captionPlacement = resolveCaptionPlacement({
    avoidZones: [
      { x: state.cursor.x - 0.03, y: state.cursor.y - 0.03, w: 0.06, h: 0.06 },
      { x: 0.55, y: 0.32, w: 0.25, h: 0.2 },
    ],
    phase: state.captionPhase,
  })

  const captionOpacity = spring({
    frame: frame - Math.round(fps * (state.captionPhase === 'action' ? 2.8 : state.captionPhase === 'data' ? 6 : 9)),
    fps,
    config: designTokens.spring.gentle,
  })

  const usersTarget = resolveTarget('users')

  return (
    <AbsoluteFill
      style={{
        background: designTokens.colors.bg,
        fontFamily: designTokens.fonts.sans,
        overflow: 'hidden',
      }}
    >
      {/* Office establishing background */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `linear-gradient(160deg, #1a1f2e 0%, #0d1117 40%, ${designTokens.colors.bg} 100%)`,
          opacity: establishing,
        }}
      >
        <div
          style={{
            position: 'absolute',
            bottom: '18%',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '55%',
            height: '28%',
            borderRadius: 12,
            background: 'linear-gradient(180deg, #2a3142, #151820)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
            opacity: interpolate(timeSec, [0, 1], [0, 0.7]),
          }}
        />
      </div>

      {/* Ambient glow */}
      <div
        style={{
          position: 'absolute',
          width: '70%',
          height: '45%',
          top: '25%',
          left: '15%',
          borderRadius: '50%',
          background: `radial-gradient(circle, ${designTokens.colors.accent}44 0%, transparent 70%)`,
          filter: 'blur(50px)',
          opacity: 0.4 + progress * 0.2,
        }}
      />

      {/* Browser stage — 82% width, perspective camera */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          perspective: 1200,
          padding: '0 9%',
        }}
      >
        <div
          style={{
            width: '82%',
            transform: `
              scale(${camera.scale * browserReveal})
              translateX(${camera.translateX}px)
              translateY(${camera.translateY}px)
              rotateY(${camera.rotateY}deg)
            `,
            transformStyle: 'preserve-3d',
            filter: camera.blur > 0 ? `blur(${camera.blur}px)` : undefined,
            transition: 'none',
          }}
        >
          <BrowserFrame url={props.url} theme={props.theme} chromeReveal={browserReveal}>
            <BrowserToolbar url={props.url ?? 'app.demo/dashboard'} theme={props.theme} />
            <div style={{ position: 'relative', display: 'flex', minHeight: 320 }}>
              <PageTransition
                page={state.page}
                loadingProgress={state.loadingProgress}
                title={props.title}
                subtitle={props.subtitle}
                theme={props.theme}
                dataValue={state.dataValue}
                dataAnimating={state.dataAnimating}
                buttonPulse={1 - buttonPulse}
              />

              {detailPhase && usersTarget ? (
                <Spotlight x={usersTarget.x} y={usersTarget.y} active={detailPhase && !showCTA} />
              ) : null}

              {showCursor ? (
                <>
                  <CursorTrail x={state.cursor.x} y={state.cursor.y} visible={!state.clicking} />
                  {state.clicks.map((c) => (
                    <ClickRipple
                      key={c.at}
                      x={c.x}
                      y={c.y}
                      atFrame={Math.round(c.at * fps)}
                    />
                  ))}
                  <SimulatorCursor x={state.cursor.x} y={state.cursor.y} clicking={state.clicking} />
                </>
              ) : null}
            </div>
          </BrowserFrame>
        </div>
      </div>

      {/* Phase caption with safe-area placement */}
      {captionOpacity > 0.05 && !showCTA ? (
        <div style={{ ...placementStyle(captionPlacement), zIndex: 40, opacity: Math.min(1, captionOpacity) }}>
          <div
            style={{
              fontSize: state.captionPhase === 'data' ? 36 : 32,
              fontWeight: 800,
              color: designTokens.colors.text,
              textShadow: '0 4px 24px rgba(0,0,0,0.8)',
              background: 'rgba(5,7,10,0.55)',
              padding: '10px 20px',
              borderRadius: 10,
              border: `1px solid ${designTokens.colors.border}`,
            }}
          >
            {state.captionText}
          </div>
        </div>
      ) : null}

      {/* CTA / Result punch */}
      <DataCounter
        value={props.metric?.value ?? 300}
        suffix={props.metric?.suffix ?? '%'}
        label={props.metric?.label ?? '效率提升'}
        active={showCTA}
      />
    </AbsoluteFill>
  )
}
