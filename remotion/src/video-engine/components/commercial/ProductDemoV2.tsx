/**
 * ProductDemoV2 — cinematic product demo for commercial videos.
 *
 * Replaces the flat v1 ProductDemo with a multi-phase commercial hero shot:
 *
 *   Phase 1 (0-20%)   Hero entrance  — device flies in with 3D tilt + screen glow
 *   Phase 2 (20-50%)  Screen reveal  — camera zooms into the screen, UI fades in
 *   Phase 3 (50-80%)  Feature highlight — numbered callouts spotlight UI regions
 *   Phase 4 (80-100%) Data punch     — metric counter ticks up dramatically + chart
 *
 * Integrates with the new engines:
 *   - Shot Engine: scene.shot drives the continuous camera move on the device
 *   - Caption Engine 2.0: renders kinetic captions over the demo when enabled
 *   - visualLayer: background tint + overlay glow from the director's block
 *
 * Driven entirely by VideoScene JSON (scene.props + scene.shot + scene.caption),
 * so the AI Director controls it without any code changes.
 */

import React, { useMemo } from 'react'
import {
  AbsoluteFill,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion'
import type { ProductDemoV2Props, UiStep, VideoScene } from '@xueai/shared'
import { buildDefaultProductDemoSteps } from '@xueai/shared'
import { designTokens } from '../../design-system/tokens.js'
import { DeviceStage } from './DeviceStage.js'
import { FeatureCallout, type FeatureCalloutItem } from './FeatureCallout.js'
import { Cursor } from '../motion/Cursor.js'
import { TextReveal } from '../motion/TextReveal.js'
import type { SceneComponentProps } from '../../registry/types.js'

function resolveSrc(src?: string) {
  if (!src) return null
  if (src.startsWith('http://') || src.startsWith('https://')) return src
  return staticFile(src)
}

function parseProps(scene: VideoScene): ProductDemoV2Props {
  const raw = (scene.props as Partial<ProductDemoV2Props> | undefined) ?? {}
  const title = raw.title ?? scene.caption?.text ?? 'Product Demo'
  return {
    title,
    subtitle: raw.subtitle,
    url: raw.url ?? 'app.demo/dashboard',
    steps:
      raw.steps ??
      buildDefaultProductDemoSteps({
        process: scene.meta?.action,
        result: scene.caption?.text,
        duration: scene.duration,
      }),
    screenshot: raw.screenshot ?? scene.media?.image,
    theme: raw.theme ?? 'dark',
    device: raw.device ?? 'browser',
    features: raw.features,
    metric: raw.metric,
  }
}

/** Animated metric counter for the data-punch phase. */
const MetricPunch: React.FC<{
  label: string
  value: number
  suffix?: string
  active: boolean
  progress: number
}> = ({ label, value, suffix, active, progress }) => {
  if (!active) return null
  const display = Math.round(interpolate(progress, [0, 1], [0, value], { extrapolateRight: 'clamp' }))
  const barWidth = interpolate(progress, [0, 1], [0, 100], { extrapolateRight: 'clamp' })
  return (
    <div style={{ textAlign: 'center', padding: '0 24px' }}>
      <div style={{ fontSize: 13, color: designTokens.colors.muted, marginBottom: 10 }}>{label}</div>
      <div
        style={{
          fontSize: 64,
          fontWeight: 900,
          color: designTokens.colors.accent,
          fontFamily: designTokens.fonts.mono,
          textShadow: `0 0 32px ${designTokens.colors.accent}88`,
          letterSpacing: -1,
        }}
      >
        {display}
        {suffix ?? ''}
      </div>
      <div
        style={{
          marginTop: 14,
          height: 6,
          width: '80%',
          marginLeft: '10%',
          borderRadius: 3,
          background: 'rgba(255,255,255,0.08)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${barWidth}%`,
            background: `linear-gradient(90deg, ${designTokens.colors.accent}, ${designTokens.colors.accentBlue})`,
            borderRadius: 3,
            boxShadow: `0 0 16px ${designTokens.colors.accentBlue}aa`,
          }}
        />
      </div>
    </div>
  )
}

export const ProductDemoV2: React.FC<SceneComponentProps> = ({ scene, durationInFrames }) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const props = useMemo(() => parseProps(scene), [scene])
  const totalSec = durationInFrames / fps
  const timeSec = frame / fps
  const progress = Math.min(1, frame / Math.max(1, durationInFrames))

  // Phase boundaries (by progress).
  const HERO_END = 0.2
  const REVEAL_END = 0.5
  const FEATURE_END = 0.8

  // Hero entrance spring.
  const enter = spring({ frame, fps, config: designTokens.spring.smooth, durationInFrames: Math.round(durationInFrames * HERO_END) })

  // Screen zoom: ramps up during the reveal phase, holds through feature + data.
  const screenZoom = interpolate(progress, [HERO_END, REVEAL_END], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  // Screenshot backdrop.
  const screenshot = resolveSrc(props.screenshot)

  // UI content opacity — fades in during reveal phase.
  const uiOpacity = interpolate(progress, [HERO_END * 0.8, REVEAL_END * 0.7], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  // Feature callouts — appear sequentially during the feature phase.
  const featureItems: FeatureCalloutItem[] = useMemo(() => {
    const features = props.features ?? []
    const featureStart = Math.round(durationInFrames * HERO_END)
    const featureSpan = Math.max(1, Math.round(durationInFrames * (FEATURE_END - HERO_END)))
    return features.map((f, i) => ({
      index: f.index,
      x: f.x,
      y: f.y,
      label: f.label,
      appearAt: featureStart + Math.round((featureSpan / Math.max(1, features.length)) * i),
    }))
  }, [props.features, durationInFrames])

  // Data punch — active in the final phase.
  const metric = props.metric
  const dataActive = progress >= FEATURE_END
  const dataProgress = interpolate(progress, [FEATURE_END, 1], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  // visualLayer background tint + overlay glow.
  const bgTint = scene.visualLayer?.background
  const overlayGlow = scene.visualLayer?.overlay

  return (
    <AbsoluteFill
      style={{
        background: bgTint
          ? `radial-gradient(circle at 50% 35%, ${designTokens.colors.accent}33 0%, ${designTokens.colors.bg} 65%)`
          : designTokens.colors.bg,
        fontFamily: designTokens.fonts.sans,
        overflow: 'hidden',
      }}
    >
      {/* Overlay glow layer (from director visualLayer.overlay) */}
      {overlayGlow ? (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(circle at 50% 50%, ${designTokens.colors.accentBlue}22 0%, transparent 60%)`,
            opacity: interpolate(progress, [0, HERO_END, 1], [0, 0.5, 0.3]),
            pointerEvents: 'none',
          }}
        />
      ) : null}

      <DeviceStage
        device={props.device}
        url={props.url}
        theme={props.theme}
        shot={scene.shot}
        progress={progress}
        enter={enter}
        screenZoom={screenZoom}
        screenContent={
          <>
            {/* Screenshot backdrop */}
            {screenshot ? (
              <Img
                src={screenshot}
                style={{
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  opacity: uiOpacity * 0.9,
                }}
              />
            ) : null}

            {/* UI content */}
            <div
              style={{
                position: 'relative',
                zIndex: 2,
                padding: 32,
                opacity: uiOpacity,
                minHeight: 360,
              }}
            >
              <div style={{ fontSize: 12, color: designTokens.colors.muted, marginBottom: 8 }}>
                {props.device === 'phone' ? 'App' : 'Dashboard'}
              </div>
              <div style={{ fontSize: 28, fontWeight: 800, color: designTokens.colors.text, marginBottom: 8 }}>
                {props.title}
              </div>
              {props.subtitle ? (
                <div style={{ fontSize: 14, color: designTokens.colors.muted, marginBottom: 16 }}>
                  {props.subtitle}
                </div>
              ) : null}

              {/* Data punch takes over the screen in the final phase */}
              {dataActive && metric ? (
                <div style={{ marginTop: 24 }}>
                  <MetricPunch
                    label={metric.label}
                    value={metric.value}
                    suffix={metric.suffix}
                    active={dataActive}
                    progress={dataProgress}
                  />
                </div>
              ) : (
                <>
                  <TextReveal text={scene.caption?.text ?? props.title} startFrame={Math.round(fps * 0.4)} />
                  {/* Simple progress bar tied to scene progress */}
                  <div
                    style={{
                      marginTop: 24,
                      height: 4,
                      width: `${progress * 100}%`,
                      background: `linear-gradient(90deg, ${designTokens.colors.accent}, ${designTokens.colors.accentBlue})`,
                      borderRadius: 2,
                    }}
                  />
                </>
              )}
            </div>

            {/* Feature callouts overlay */}
            {featureItems.length > 0 ? <FeatureCallout items={featureItems} /> : null}

            {/* Cursor follows uiSteps */}
            <Cursor steps={props.steps} durationInFrames={durationInFrames} />
          </>
        }
      />

      {/* Captions are rendered by the SceneRenderer's SubtitleTrack (which
          delegates to CaptionRenderer for kinetic mode), so this component
          stays focused on the device choreography + data punch. */}
    </AbsoluteFill>
  )
}
