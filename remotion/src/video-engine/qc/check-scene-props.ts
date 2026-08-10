import type { UiStep, VideoCompositionJSON, VideoScene } from '@xueai/shared'
import { validateUiSteps } from '@xueai/shared'
import { compositionToRenderInput } from '../adapters/legacy-bridge.js'
import { checkRenderInputVisual, type VisualQcIssue } from './check-visual.js'

export function checkCompositionVisual(composition: VideoCompositionJSON): VisualQcIssue[] {
  const legacyIssues = checkRenderInputVisual(compositionToRenderInput(composition))
  const issues = [...legacyIssues]

  composition.scenes.forEach((scene) => {
    const componentIssues = checkSceneComponentProps(scene)
    issues.push(...componentIssues)
  })

  return issues
}

function checkSceneComponentProps(scene: VideoScene): VisualQcIssue[] {
  const issues: VisualQcIssue[] = []
  const component = String(scene.component)

  if (component === 'ProductDemo' || component === 'BrowserWindow') {
    const steps = (scene.props as { steps?: unknown[] } | undefined)?.steps
    if (!steps?.length) {
      issues.push({
        scene: scene.order,
        code: 'MISSING_UI_STEPS',
        message: `Scene ${scene.order} ${component} missing props.steps`,
        severity: 'minor',
      })
    } else {
      const validationErrors = validateUiSteps(steps as UiStep[], scene.duration)
      validationErrors.forEach((msg) => {
        issues.push({
          scene: scene.order,
          code: 'INVALID_UI_STEPS',
          message: `Scene ${scene.order}: ${msg}`,
          severity: 'minor',
        })
      })
    }
  }

  if (component === 'DashboardAnimation') {
    const metrics = (scene.props as { metrics?: unknown[] } | undefined)?.metrics
    if (!metrics?.length) {
      issues.push({
        scene: scene.order,
        code: 'MISSING_DASHBOARD_METRICS',
        message: `Scene ${scene.order} DashboardAnimation missing props.metrics`,
        severity: 'minor',
      })
    }
  }

  return issues
}
