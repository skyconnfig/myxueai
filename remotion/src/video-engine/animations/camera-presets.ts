export interface MotionConfig {
  scaleFrom: number
  scaleTo: number
  translateXFrom: number
  translateXTo: number
  translateYFrom: number
  translateYTo: number
}

const DEFAULT_MOTION: MotionConfig = {
  scaleFrom: 1,
  scaleTo: 1.06,
  translateXFrom: 0,
  translateXTo: 0,
  translateYFrom: 0,
  translateYTo: 0,
}

export function getCameraPreset(cameraType?: string, speed = 0.5): MotionConfig {
  const intensity = 0.6 + speed * 0.8
  switch (cameraType) {
    // Zoom in — push / dolly in
    case 'zoom_in':
    case 'push_in':
    case 'slow_dolly_in':
    case 'dolly_in':
      return {
        scaleFrom: 1,
        scaleTo: 1 + 0.1 * intensity,
        translateXFrom: 0,
        translateXTo: 0,
        translateYFrom: 0,
        translateYTo: 0,
      }
    // Zoom out — pull / dolly out
    case 'zoom_out':
    case 'pull_out':
    case 'slow_dolly_out':
    case 'dolly_out':
      return {
        scaleFrom: 1 + 0.12 * intensity,
        scaleTo: 1,
        translateXFrom: 0,
        translateXTo: 0,
        translateYFrom: 0,
        translateYTo: 0,
      }
    case 'pan_left':
      return {
        scaleFrom: 1.08,
        scaleTo: 1.08,
        translateXFrom: 40 * intensity,
        translateXTo: -40 * intensity,
        translateYFrom: 0,
        translateYTo: 0,
      }
    case 'pan_right':
    case 'tracking':
      return {
        scaleFrom: 1.08,
        scaleTo: 1.08,
        translateXFrom: -40 * intensity,
        translateXTo: 40 * intensity,
        translateYFrom: 0,
        translateYTo: 0,
      }
    case 'pan_up':
      return {
        scaleFrom: 1.08,
        scaleTo: 1.08,
        translateXFrom: 0,
        translateXTo: 0,
        translateYFrom: 40 * intensity,
        translateYTo: -40 * intensity,
      }
    case 'pan_down':
      return {
        scaleFrom: 1.08,
        scaleTo: 1.08,
        translateXFrom: 0,
        translateXTo: 0,
        translateYFrom: -40 * intensity,
        translateYTo: 40 * intensity,
      }
    case 'orbit':
      return {
        scaleFrom: 1.04,
        scaleTo: 1 + 0.1 * intensity,
        translateXFrom: -20 * intensity,
        translateXTo: 20 * intensity,
        translateYFrom: 10 * intensity,
        translateYTo: -10 * intensity,
      }
    // Parallax — depth shift between fore/back (simulated via scale + drift)
    case 'parallax':
      return {
        scaleFrom: 1.05,
        scaleTo: 1.12,
        translateXFrom: 25 * intensity,
        translateXTo: -25 * intensity,
        translateYFrom: 10 * intensity,
        translateYTo: -10 * intensity,
      }
    case 'handheld':
      return {
        scaleFrom: 1.02,
        scaleTo: 1.06,
        translateXFrom: -8,
        translateXTo: 8,
        translateYFrom: -6,
        translateYTo: 6,
      }
    case 'static':
      return {
        scaleFrom: 1,
        scaleTo: 1,
        translateXFrom: 0,
        translateXTo: 0,
        translateYFrom: 0,
        translateYTo: 0,
      }
    default:
      return DEFAULT_MOTION
  }
}

/** @deprecated use getCameraPreset */
export function getMotionConfig(cameraMotion?: string): MotionConfig {
  return getCameraPreset(cameraMotion)
}

export function getEmotionTint(emotion?: string) {
  switch (emotion) {
    case 'stress':
    case 'urgency':
      return 'rgba(15, 23, 42, 0.35)'
    case 'confidence':
      return 'rgba(30, 58, 138, 0.18)'
    case 'relief':
    case 'success':
      return 'rgba(180, 83, 9, 0.12)'
    case 'calm':
      return 'rgba(15, 118, 110, 0.12)'
    case 'curiosity':
      return 'rgba(109, 40, 217, 0.14)'
    default:
      return 'rgba(0, 0, 0, 0.25)'
  }
}
