import { linearTiming, springTiming } from '@remotion/transitions'
import { fade } from '@remotion/transitions/fade'
import { slide } from '@remotion/transitions/slide'

export function getTransitionPresentation(transition?: string) {
  switch (transition) {
    case 'push':
      return slide({ direction: 'from-right' })
    case 'fade':
    case 'crossfade':
      return fade()
    case 'cut':
    default:
      return fade()
  }
}

export function getTransitionTiming(transition?: string) {
  if (transition === 'cut') {
    return linearTiming({ durationInFrames: 1 })
  }
  if (transition === 'push') {
    return springTiming({ config: { damping: 200 }, durationInFrames: 18 })
  }
  return linearTiming({ durationInFrames: 15 })
}

export const transitionEngine = {
  getTransitionPresentation,
  getTransitionTiming,
}
