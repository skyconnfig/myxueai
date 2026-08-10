import React from 'react'
import { interpolate, useCurrentFrame } from 'remotion'
import type { CameraConfig } from '@xueai/shared'
import { getCameraPreset } from './camera-presets.js'

export interface CameraMoveProps {
  camera?: CameraConfig
  durationInFrames: number
  children: React.ReactNode
  disabled?: boolean
}

export const CameraMove: React.FC<CameraMoveProps> = ({
  camera,
  durationInFrames,
  children,
  disabled,
}) => {
  const frame = useCurrentFrame()

  if (disabled || !camera?.type || camera.type === 'static') {
    return <>{children}</>
  }

  const motion = getCameraPreset(camera.type, camera.speed ?? 0.5)
  const progress = durationInFrames <= 1 ? 0 : frame / Math.max(durationInFrames - 1, 1)

  const scale = interpolate(progress, [0, 1], [motion.scaleFrom, motion.scaleTo], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
  const translateX = interpolate(progress, [0, 1], [motion.translateXFrom, motion.translateXTo], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
  const translateY = interpolate(progress, [0, 1], [motion.translateYFrom, motion.translateYTo], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        transform: `scale(${scale}) translate(${translateX}px, ${translateY}px)`,
        transformOrigin: 'center center',
      }}
    >
      {children}
    </div>
  )
}
