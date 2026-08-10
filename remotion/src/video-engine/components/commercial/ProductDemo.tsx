import React, { useMemo } from 'react'
import { AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion'
import type { ProductDemoProps, UiStep, VideoScene } from '@xueai/shared'
import { buildDefaultProductDemoSteps } from '@xueai/shared'
import { designTokens } from '../../design-system/tokens.js'
import { BrowserMockup } from '../mockups/BrowserMockup.js'
import { Cursor } from '../motion/Cursor.js'
import { DataChart } from '../motion/DataChart.js'
import { TextReveal } from '../motion/TextReveal.js'
import type { SceneComponentProps } from '../../registry/types.js'

function resolveSrc(src?: string) {
  if (!src) return null
  if (src.startsWith('http://') || src.startsWith('https://')) return src
  return staticFile(src)
}

function parseProps(scene: VideoScene): ProductDemoProps {
  const raw = scene.props as Partial<ProductDemoProps> | undefined
  const title = raw?.title ?? scene.caption?.text ?? 'Product Demo'
  return {
    title,
    subtitle: raw?.subtitle,
    url: raw?.url ?? 'app.demo/dashboard',
    steps:
      raw?.steps ??
      buildDefaultProductDemoSteps({
        process: scene.meta?.action,
        result: scene.caption?.text,
        duration: scene.duration,
      }),
    screenshot: raw?.screenshot ?? scene.media?.image,
    theme: raw?.theme ?? 'dark',
  }
}

function resolveActivePage(steps: UiStep[], timeSec: number, defaultTitle: string) {
  const navigations = steps.filter((s) => s.action === 'navigate').sort((a, b) => a.at - b.at)
  let pageIndex = 0
  let pageTitle = defaultTitle
  for (const nav of navigations) {
    if (timeSec >= nav.at) {
      pageTitle = String(nav.value ?? defaultTitle)
      pageIndex += 1
    }
  }
  return { pageIndex, pageTitle }
}

function resolveTypeStep(steps: UiStep[], timeSec: number) {
  const typeSteps = steps.filter((s) => s.action === 'type').sort((a, b) => a.at - b.at)
  for (let i = typeSteps.length - 1; i >= 0; i--) {
    if (timeSec >= typeSteps[i].at) return typeSteps[i]
  }
  return null
}

export const ProductDemo: React.FC<SceneComponentProps> = ({ scene, durationInFrames }) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const props = useMemo(() => parseProps(scene), [scene])
  const enter = spring({ frame, fps, config: designTokens.spring.smooth })
  const slideY = interpolate(enter, [0, 1], [60, 0])
  const screenshot = resolveSrc(props.screenshot)
  const timeSec = frame / fps

  const { pageIndex, pageTitle } = resolveActivePage(props.steps, timeSec, props.title)
  const typeStep = resolveTypeStep(props.steps, timeSec)

  const dataStep = props.steps.find((s) => s.action === 'dataChange')
  const metricTarget = typeof dataStep?.value === 'number' ? dataStep.value : 72
  const dataStartSec = dataStep?.at ?? durationInFrames / fps * 0.75
  const dataProgress =
    timeSec <= dataStartSec
      ? 0
      : Math.min(1, (timeSec - dataStartSec) / Math.max(0.5, (durationInFrames / fps) - dataStartSec))

  const pageTransition = spring({
    frame: Math.max(0, frame - Math.round((props.steps.find((s) => s.action === 'navigate')?.at ?? 0) * fps)),
    fps,
    config: designTokens.spring.snappy,
  })

  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(circle at 30% 20%, rgba(99,102,241,0.35) 0%, ${designTokens.colors.bg} 55%)`,
        justifyContent: 'center',
        alignItems: 'center',
        fontFamily: designTokens.fonts.sans,
      }}
    >
      <div style={{ transform: `translateY(${slideY}px)`, opacity: enter, width: '100%', display: 'flex', justifyContent: 'center' }}>
        <BrowserMockup url={props.url} theme={props.theme}>
          <div style={{ padding: 32, position: 'relative', minHeight: 360 }}>
            {screenshot ? (
              <Img
                src={screenshot}
                style={{
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  opacity: pageIndex === 0 ? 0.25 : 0.12,
                }}
              />
            ) : null}
            <div
              style={{
                position: 'relative',
                zIndex: 2,
                opacity: pageIndex > 0 ? pageTransition : 1,
                transform: pageIndex > 0 ? `translateX(${interpolate(pageTransition, [0, 1], [24, 0])}px)` : undefined,
              }}
            >
              <div style={{ fontSize: 12, color: designTokens.colors.muted, marginBottom: 8 }}>
                {pageIndex === 0 ? 'Dashboard' : 'Workflow'}
              </div>
              <div style={{ fontSize: 28, fontWeight: 800, color: designTokens.colors.text, marginBottom: 8 }}>
                {pageTitle}
              </div>
              {props.subtitle && pageIndex === 0 ? (
                <div style={{ fontSize: 14, color: designTokens.colors.muted, marginBottom: 16 }}>
                  {props.subtitle}
                </div>
              ) : null}
              {pageIndex === 0 ? (
                <>
                  <TextReveal text={scene.caption?.text ?? props.title} startFrame={Math.round(fps * 0.5)} />
                  <DataChart label="Efficiency" value={metricTarget} progress={dataProgress} />
                </>
              ) : (
                <div style={{ marginTop: 12 }}>
                  <div style={{ fontSize: 13, color: designTokens.colors.muted, marginBottom: 8 }}>
                    Action output
                  </div>
                  {typeStep ? (
                    <TextReveal
                      text={String(typeStep.value ?? '')}
                      startFrame={Math.round(typeStep.at * fps)}
                      charsPerFrame={1.2}
                    />
                  ) : (
                    <TextReveal text={scene.caption?.text ?? props.title} startFrame={Math.round(fps * 0.3)} />
                  )}
                </div>
              )}
            </div>
            <Cursor steps={props.steps} durationInFrames={durationInFrames} />
          </div>
        </BrowserMockup>
      </div>
    </AbsoluteFill>
  )
}
