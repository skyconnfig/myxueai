/**
 * ShotTransition — micro-transition overlay rendered at sub-shot boundaries.
 *
 * These are NOT the @remotion/transitions between scenes (handled by
 * TransitionSeries in CompositionManager). These are fast in-scene beats between
 * sub-shots that sell the "multiple camera angles" illusion: a whip pan blur,
 * a hard flash, or a zoom burst. They last 4-8 frames so they read as energetic
 * cuts, not slow transitions.
 */

import React from 'react'
import { AbsoluteFill, interpolate } from 'remotion'
import type { SubShot } from './ShotPlanner.js'

export interface ShotTransitionProps {
  /** the sub-shot we are transitioning INTO */
  subShot: SubShot
  /** frame within the scene (0-based) */
  frame: number
  /** fps */
  fps: number
}

/** Duration of each micro-transition type in frames. */
const TRANSITION_FRAMES: Record<SubShot['transitionIn'], number> = {
  cut: 0,
  whip: 7,
  flash: 4,
  zoom_burst: 6,
}

/**
 * Render the micro-transition overlay for the active sub-shot, if we are
 * currently within its transition-in window. Returns null outside the window.
 */
export const ShotTransition: React.FC<ShotTransitionProps> = ({ subShot, frame, fps }) => {
  const dur = TRANSITION_FRAMES[subShot.transitionIn]
  if (dur <= 0) return null

  // frame is the scene-relative frame; convert to sub-shot-relative frame.
  const localFrame = frame - subShot.startFrame
  if (localFrame < 0 || localFrame >= dur) return null

  const t = localFrame / Math.max(dur - 1, 1) // 0..1 across the transition

  switch (subShot.transitionIn) {
    case 'whip': {
      // Directional motion blur: a horizontal white streak that sweeps across.
      const slideX = interpolate(t, [0, 1], [120, -120])
      const opacity = interpolate(t, [0, 0.5, 1], [0, 0.55, 0])
      return (
        <AbsoluteFill
          style={{
            pointerEvents: 'none',
            background: `linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,${opacity}) 50%, rgba(255,255,255,0) 100%)`,
            transform: `translateX(${slideX}px)`,
            mixBlendMode: 'screen',
          }}
        />
      )
    }
    case 'flash': {
      // Quick white flash that fades out — hard cut energy.
      const opacity = interpolate(t, [0, 0.4, 1], [0.85, 0.4, 0])
      return (
        <AbsoluteFill
          style={{ pointerEvents: 'none', backgroundColor: `rgba(255,255,255,${opacity})` }}
        />
      )
    }
    case 'zoom_burst': {
      // Brief radial zoom: a dark vignette that contracts — sells a snap zoom in.
      const scale = interpolate(t, [0, 1], [1.6, 1])
      const opacity = interpolate(t, [0, 0.5, 1], [0, 0.5, 0])
      return (
        <AbsoluteFill
          style={{
            pointerEvents: 'none',
            background: `radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,${opacity}) 100%)`,
            transform: `scale(${scale})`,
          }}
        />
      )
    }
    default:
      return null
  }
}

export const shotTransitionDuration = (t: SubShot['transitionIn']) => TRANSITION_FRAMES[t]

export { TRANSITION_FRAMES as SHOT_TRANSITION_FRAMES }
