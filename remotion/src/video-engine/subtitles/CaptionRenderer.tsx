/**
 * CaptionRenderer — kinetic typography renderer for Caption Engine 2.0.
 *
 * Replaces the static centered text in SubtitleTrack with:
 *  - word-by-word reveal synced to TTS cue timing
 *  - per-keyword animations (scale / fade / spring / highlight)
 *  - style presets (tech / documentary / commercial)
 *
 * Driven entirely by VideoScene JSON: `caption.kinetic`, `caption.preset`,
 * `caption.animation` + the existing `props.subtitleCues`.
 */

import React, { useMemo } from 'react'
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion'
import type { VideoScene } from '@xueai/shared'
import { buildCaptionPlan } from './CaptionEngine.js'
import { resolveCaptionStyle, type CaptionStylePreset } from './CaptionStyles.js'
import { parseSubtitleCues } from './subtitle-timing.js'

export interface CaptionRendererProps {
  scene: VideoScene
}

/** Compute the per-token entrance progress at a given frame. */
function tokenProgress(
  frame: number,
  fps: number,
  tokenStartSec: number,
  enterSec: number,
  animation: string,
): number {
  const startFrame = Math.round(tokenStartSec * fps)
  const enterFrames = Math.max(2, Math.round(enterSec * fps))
  const local = frame - startFrame
  if (local < 0) return 0
  if (animation === 'spring') {
    return spring({ frame: local, fps, config: { damping: 12, mass: 0.6, stiffness: 200 } })
  }
  // scale / fade / highlight use a smooth interpolate.
  return interpolate(local, [0, enterFrames], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
}

/** Render the keyword decoration (bar / box / glow) under/around a token. */
function renderDecoration(
  preset: CaptionStylePreset & { fontSize: number },
  isKeyword: boolean,
  accentColor: string,
): React.CSSProperties {
  if (!isKeyword || preset.keywordDecoration === 'none') return {}
  const decoColor = preset.decorationColor ?? accentColor
  switch (preset.keywordDecoration) {
    case 'bar':
      return { borderBottom: `3px solid ${decoColor}`, paddingBottom: 2 }
    case 'box':
      return {
        backgroundColor: `${decoColor}22`,
        border: `1.5px solid ${decoColor}`,
        borderRadius: 6,
        padding: '1px 8px',
        margin: '0 2px',
      }
    case 'glow':
      return { textShadow: `0 0 16px ${decoColor}, ${preset.shadow}` }
    default:
      return {}
  }
}

export const CaptionRenderer: React.FC<CaptionRendererProps> = ({ scene }) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  const caption = scene.caption
  const preset = caption?.preset ?? 'tech'
  const animation = caption?.animation ?? 'spring'
  const style = useMemo(
    () =>
      resolveCaptionStyle(preset, caption?.style),
    [preset, caption?.style],
  )

  const cues = useMemo(
    () => parseSubtitleCues(scene.props?.subtitleCues ?? []),
    [scene.props?.subtitleCues],
  )
  const plan = useMemo(() => buildCaptionPlan(cues, animation), [cues, animation])

  // Find the active cue at the current frame.
  const frameSec = frame / fps
  const activeCue = plan.cues.find((c) => frameSec >= c.startSec && frameSec < c.endSec)
  if (!activeCue) return null

  return (
    <div
      style={{
        position: 'absolute',
        bottom: style.bottom,
        left: 0,
        right: 0,
        display: 'flex',
        justifyContent: style.align === 'center' ? 'center' : 'flex-start',
        padding: `0 ${style.paddingX}px`,
        pointerEvents: 'none',
        zIndex: 25,
      }}
    >
      <div
        style={{
          maxWidth: `${style.maxWidthPct}%`,
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.18em',
          justifyContent: style.align === 'center' ? 'center' : 'flex-start',
          fontFamily: style.font,
          fontSize: style.fontSize,
          color: style.color,
          fontWeight: style.fontWeight,
          letterSpacing: style.letterSpacing,
          lineHeight: style.lineHeight,
          textShadow: style.shadow,
          background: style.background,
          padding: style.background && style.background !== 'transparent' ? '10px 22px' : 0,
          borderRadius: style.background && style.background !== 'transparent' ? 14 : 0,
        }}
      >
        {activeCue.tokens.map((token, i) => {
          const anim = activeCue.animations[i]
          const p = tokenProgress(frame, fps, token.startSec ?? 0, anim.enterSec, anim.type)
          if (p <= 0) return null

          const isKw = token.isKeyword
          const accentColor = style.accentColor
          const deco = renderDecoration(style, isKw, accentColor)

          // Per-animation transform / opacity.
          let opacity = 1
          let scale = 1
          if (anim.type === 'fade') {
            opacity = p
            scale = isKw ? interpolate(p, [0, 1], [1, anim.scale]) : 1
          } else if (anim.type === 'scale') {
            opacity = p
            scale = isKw ? interpolate(p, [0, 1], [0.7, anim.scale]) : interpolate(p, [0, 1], [0.85, 1])
          } else if (anim.type === 'spring') {
            opacity = Math.min(1, p * 1.3)
            scale = isKw ? 1 + (anim.scale - 1) * p : interpolate(p, [0, 1], [0.8, 1])
          } else if (anim.type === 'highlight') {
            opacity = p
            scale = 1
          }

          const tokenColor = isKw ? accentColor : style.color
          const tokenWeight = isKw ? style.keywordWeight : style.fontWeight
          const tokenText = isKw && style.uppercaseKeywords ? token.text.toUpperCase() : token.text

          return (
            <span
              key={i}
              style={{
                display: 'inline-block',
                color: tokenColor,
                fontWeight: tokenWeight,
                opacity,
                transform: `scale(${scale})`,
                transformOrigin: 'center bottom',
                ...deco,
              }}
            >
              {tokenText}
            </span>
          )
        })}
      </div>
    </div>
  )
}
