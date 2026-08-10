import React, { useMemo } from 'react'
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion'
import type { BrowserWindowProps, VideoScene } from '@xueai/shared'
import { buildDefaultProductDemoSteps } from '@xueai/shared'
import { designTokens } from '../../design-system/tokens.js'
import { BrowserMockup } from '../mockups/BrowserMockup.js'
import { Cursor } from '../motion/Cursor.js'
import { TextReveal } from '../motion/TextReveal.js'
import type { SceneComponentProps } from '../../registry/types.js'

function parseProps(scene: VideoScene): BrowserWindowProps {
  const raw = scene.props as Partial<BrowserWindowProps> | undefined
  return {
    title: raw?.title ?? scene.caption?.text ?? 'Dashboard',
    url: raw?.url ?? 'app.demo',
    body: raw?.body ?? scene.meta?.action ?? 'Automated workflow preview',
    steps:
      raw?.steps ??
      buildDefaultProductDemoSteps({
        process: scene.meta?.action,
        result: scene.caption?.text,
        duration: scene.duration,
      }).slice(0, 3),
    theme: raw?.theme ?? 'dark',
  }
}

export const BrowserWindow: React.FC<SceneComponentProps> = ({ scene, durationInFrames }) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const props = useMemo(() => parseProps(scene), [scene])
  const enter = spring({ frame, fps, config: designTokens.spring.snappy })
  const slideX = interpolate(enter, [0, 1], [120, 0])

  return (
    <AbsoluteFill
      style={{
        background: designTokens.colors.bg,
        justifyContent: 'center',
        alignItems: 'center',
        fontFamily: designTokens.fonts.sans,
      }}
    >
      <div style={{ transform: `translateX(${slideX}px)`, opacity: enter, width: '100%', display: 'flex', justifyContent: 'center' }}>
        <BrowserMockup url={props.url} theme={props.theme}>
          <div style={{ padding: 40, position: 'relative', minHeight: 320 }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: designTokens.colors.text, marginBottom: 16 }}>
              {props.title}
            </div>
            <TextReveal text={props.body ?? ''} startFrame={Math.round(fps * 0.3)} />
            <div
              style={{
                marginTop: 24,
                height: 4,
                width: `${Math.min(100, (frame / Math.max(durationInFrames - 1, 1)) * 100)}%`,
                background: designTokens.colors.accentBlue,
                borderRadius: 2,
              }}
            />
            <Cursor steps={props.steps ?? []} durationInFrames={durationInFrames} />
          </div>
        </BrowserMockup>
      </div>
    </AbsoluteFill>
  )
}
