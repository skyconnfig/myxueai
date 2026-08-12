/**
 * ShotDirector — orchestrates the Shot Engine for a single scene.
 *
 * Given a VideoScene with a `shot` config, it:
 *  1. plans sub-shots (ShotPlanner)
 *  2. finds the active sub-shot at the current frame
 *  3. computes the camera transform (CameraMovement)
 *  4. renders the image with that transform — including a layered parallax
 *     split for parallax shots so depth reads on a single image
 *  5. overlays the micro-transition at sub-shot boundaries (ShotTransition)
 *
 * When `scene.shot` is absent, callers should NOT use ShotDirector — the
 * legacy single-transform path in CinematicFallbackScene handles that.
 * This keeps the Shot Engine purely opt-in via VideoScene JSON.
 */

import React, { useMemo } from 'react'
import { AbsoluteFill, Img, useCurrentFrame, useVideoConfig } from 'remotion'
import type { VideoScene } from '@xueai/shared'
import { computeCameraMovement } from './CameraMovement.js'
import { planSubShots, type SubShot } from './ShotPlanner.js'
import { ShotTransition } from './ShotTransition.js'

export interface ShotDirectorProps {
  scene: VideoScene
  durationInFrames: number
  imageSrc: string
}

/** Find the sub-shot that is active at the given scene-relative frame. */
function activeSubShotAt(subShots: SubShot[], frame: number): SubShot {
  for (const s of subShots) {
    if (frame >= s.startFrame && frame < s.startFrame + s.durationInFrames) return s
  }
  return subShots[subShots.length - 1]
}

export const ShotDirector: React.FC<ShotDirectorProps> = ({
  scene,
  durationInFrames,
  imageSrc,
}) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  // Seed from scene order so plans are stable per scene position.
  const seed = Math.max(1, scene.order ?? 1)
  const subShots = useMemo(
    () => planSubShots(scene.shot, durationInFrames, fps, seed),
    [scene.shot, durationInFrames, fps, seed],
  )

  const active = activeSubShotAt(subShots, frame)
  const localFrame = frame - active.startFrame
  const transform = computeCameraMovement(active, localFrame, fps)

  const imgTransform = `scale(${transform.scale}) translate(${transform.translateX}px, ${transform.translateY}px) rotate(${transform.rotate}deg)`

  return (
    <AbsoluteFill style={{ backgroundColor: '#05070A', overflow: 'hidden' }}>
      {/* Background layer — the image with the camera transform applied. */}
      <AbsoluteFill style={{ overflow: 'hidden' }}>
        <Img
          src={imageSrc}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transform: imgTransform,
            transformOrigin: 'center center',
          }}
        />
      </AbsoluteFill>

      {/* Parallax: a second, shifted copy at lower opacity for depth feel.
          Only non-trivial when parallaxFg is set (parallax camera). */}
      {transform.parallaxFg.x !== 0 || transform.parallaxFg.y !== 0 ? (
        <AbsoluteFill style={{ overflow: 'hidden', opacity: 0.35, mixBlendMode: 'screen' }}>
          <Img
            src={imageSrc}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transform: `scale(${transform.scale * 1.04}) translate(${transform.translateX + transform.parallaxFg.x}px, ${transform.translateY + transform.parallaxFg.y}px)`,
              transformOrigin: 'center center',
            }}
          />
        </AbsoluteFill>
      ) : null}

      {/* Handheld vignette pulse — a subtle darkening that breathes with shake. */}
      {transform.shakeVignette > 0 ? (
        <AbsoluteFill
          style={{
            pointerEvents: 'none',
            background: `radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,${transform.shakeVignette}) 100%)`,
          }}
        />
      ) : null}

      {/* Micro-transition overlay at the sub-shot boundary. */}
      <ShotTransition subShot={active} frame={frame} fps={fps} />
    </AbsoluteFill>
  )
}
