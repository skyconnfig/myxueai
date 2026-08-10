import type { RenderInput, RenderScene } from '@xueai/shared'

export interface VisualQcIssue {
  scene: number
  code: string
  message: string
  severity: 'critical' | 'major' | 'minor'
}

/** Lightweight render-input QC — mirrors xueai visual-quality rules. */
export function checkRenderInputVisual(input: RenderInput): VisualQcIssue[] {
  const issues: VisualQcIssue[] = []
  let staticStreak = 0

  input.scenes.forEach((scene: RenderScene) => {
    const isUiComponent =
      scene.componentType &&
      !['cinematic_still', 'broll_video', 'CinematicFallback'].includes(scene.componentType)
    const isStatic = !isUiComponent && (!scene.cameraMotion || scene.cameraMotion === 'static')
    staticStreak = isStatic ? staticStreak + 1 : 0

    if (scene.duration > 5 && isStatic && !scene.video) {
      issues.push({
        scene: scene.order,
        code: 'STATIC_TOO_LONG',
        message: `Scene ${scene.order} static >5s without B-roll`,
        severity: 'major',
      })
    }
    if (staticStreak >= 3) {
      issues.push({
        scene: scene.order,
        code: 'STATIC_STREAK',
        message: `3+ consecutive static scenes ending at ${scene.order}`,
        severity: 'major',
      })
    }
    const hasMedia = scene.image || scene.video
    const hasUiProps = Boolean(scene.props && Object.keys(scene.props).length)
    if (!hasMedia && !isUiComponent && !hasUiProps) {
      issues.push({
        scene: scene.order,
        code: 'NO_MEDIA',
        message: `Scene ${scene.order} has no image, video, or UI component`,
        severity: 'critical',
      })
    }
  })

  return issues
}

export function summarizeQc(issues: VisualQcIssue[]) {
  return {
    pass: issues.filter((i) => i.severity === 'critical').length === 0,
    critical: issues.filter((i) => i.severity === 'critical').length,
    major: issues.filter((i) => i.severity === 'major').length,
    minor: issues.filter((i) => i.severity === 'minor').length,
    issues,
  }
}
