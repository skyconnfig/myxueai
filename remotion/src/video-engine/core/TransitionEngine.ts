import { linearTiming, springTiming } from '@remotion/transitions'
import { fade } from '@remotion/transitions/fade'
import { slide } from '@remotion/transitions/slide'
import { wipe } from '@remotion/transitions/wipe'
import { iris } from '@remotion/transitions/iris'
import { crossZoom } from '@remotion/transitions/cross-zoom'
import { dissolve } from '@remotion/transitions/dissolve'

/**
 * Default transition is CUT (hard cut). Per the spec, most shots use CUT and
 * animated transitions are reserved for moments that genuinely need them.
 */
export function getTransitionPresentation(
  transition?: string,
  dims?: { width: number; height: number },
) {
  switch (transition) {
    case 'push':
    case 'slide':
      return slide({ direction: 'from-right' })
    case 'wipe':
      return wipe({ direction: 'from-right' })
    case 'iris':
      return iris({ width: dims?.width ?? 1080, height: dims?.height ?? 1920 })
    case 'zoom':
      return crossZoom({})
    case 'morph':
      return dissolve({})
    case 'fade':
    case 'crossfade':
      return fade()
    case 'cut':
    default:
      // A 1-frame fade is the closest TransitionSeries gets to a hard cut.
      return fade()
  }
}

export function getTransitionTiming(transition?: string) {
  if (transition === 'cut' || !transition) {
    return linearTiming({ durationInFrames: 1 })
  }
  if (transition === 'push' || transition === 'slide') {
    return springTiming({ config: { damping: 200 }, durationInFrames: 18 })
  }
  if (transition === 'zoom') {
    return springTiming({ config: { damping: 120 }, durationInFrames: 20 })
  }
  if (transition === 'iris') {
    return linearTiming({ durationInFrames: 18 })
  }
  if (transition === 'wipe') {
    return linearTiming({ durationInFrames: 16 })
  }
  if (transition === 'morph') {
    return linearTiming({ durationInFrames: 22 })
  }
  // fade / crossfade
  return linearTiming({ durationInFrames: 12 })
}

/** Whether a transition is a true hard cut (no visible animation). */
export function isHardCut(transition?: string): boolean {
  return !transition || transition === 'cut'
}

export const transitionEngine = {
  getTransitionPresentation,
  getTransitionTiming,
  isHardCut,
}
