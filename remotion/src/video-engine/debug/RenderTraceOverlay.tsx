/**
 * RenderTraceOverlay — dev-only HUD showing scene/component/director field consumption.
 */

import React from 'react'
import { useCurrentFrame, useVideoConfig } from 'remotion'
import type { RenderTraceData } from './RenderTrace.js'

export interface RenderTraceOverlayProps {
  trace: RenderTraceData
}

const labelStyle: React.CSSProperties = {
  color: '#64748B',
  fontSize: 10,
  textTransform: 'uppercase',
  letterSpacing: 0.6,
  marginBottom: 2,
}

const valueStyle: React.CSSProperties = {
  color: '#E2E8F0',
  fontSize: 12,
  fontFamily: '"JetBrains Mono", ui-monospace, monospace',
  marginBottom: 8,
}

export const RenderTraceOverlay: React.FC<RenderTraceOverlayProps> = ({ trace }) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const timeSec = (frame / fps).toFixed(2)

  return (
    <div
      style={{
        position: 'absolute',
        top: 12,
        left: 12,
        zIndex: 9999,
        pointerEvents: 'none',
        background: 'rgba(5,7,10,0.82)',
        border: '1px solid rgba(99,102,241,0.45)',
        borderRadius: 10,
        padding: '10px 12px',
        minWidth: 200,
        maxWidth: 280,
        fontFamily: 'system-ui, sans-serif',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
      }}
    >
      <div style={{ ...labelStyle, color: '#6366F1', marginBottom: 6 }}>RenderTrace</div>
      <div style={labelStyle}>Scene</div>
      <div style={valueStyle}>
        {trace.sceneId} · {timeSec}s / {trace.durationSec}s
      </div>

      <div style={labelStyle}>component</div>
      <div style={valueStyle}>{trace.component}</div>

      {trace.storyBeat ? (
        <>
          <div style={labelStyle}>storyBeat</div>
          <div style={valueStyle}>{trace.storyBeat}</div>
        </>
      ) : null}

      {trace.camera || trace.shotCamera ? (
        <>
          <div style={labelStyle}>camera</div>
          <div style={valueStyle}>{trace.shotCamera ?? trace.camera ?? '—'}</div>
        </>
      ) : null}

      {trace.shotType ? (
        <>
          <div style={labelStyle}>shot</div>
          <div style={valueStyle}>{trace.shotType}</div>
        </>
      ) : null}

      <div style={labelStyle}>uiSteps</div>
      <div style={valueStyle}>{trace.uiStepsCount}</div>
      {trace.uiStepTargets.length > 0 ? (
        <div style={{ ...valueStyle, fontSize: 10, marginTop: -4, marginBottom: 8 }}>
          {trace.uiStepTargets.join(' → ')}
        </div>
      ) : null}

      {trace.captionText ? (
        <>
          <div style={labelStyle}>caption</div>
          <div style={valueStyle}>{trace.captionKinetic ? 'kinetic' : 'static'}</div>
        </>
      ) : null}

      {trace.audioSfx.length > 0 ? (
        <>
          <div style={labelStyle}>audio</div>
          <div style={valueStyle}>{trace.audioSfx.join(', ')}</div>
        </>
      ) : null}

      <div style={labelStyle}>productDemo</div>
      <div style={valueStyle}>
        {trace.simulator === false ? 'screenshot' : trace.productDemoDevice ?? 'browser'}
        {trace.hasScreenshot ? ' + img' : ' (sim)'}
      </div>
    </div>
  )
}
