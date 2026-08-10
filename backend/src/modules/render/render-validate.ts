import type { RenderInput } from '@xueai/shared'

export interface RenderValidationIssue {
  code: string
  message: string
  severity: 'critical' | 'major' | 'minor'
  scene?: number
}

export function validateRenderInput(input: RenderInput): RenderValidationIssue[] {
  const issues: RenderValidationIssue[] = []

  if (!input.scenes.length) {
    issues.push({
      code: 'NO_SCENES',
      message: '没有可渲染的分镜',
      severity: 'critical',
    })
    return issues
  }

  for (const scene of input.scenes) {
    const caption = scene.caption?.text?.trim() || scene.text?.trim()
    const hasVoice = Boolean(scene.audio?.trim())
    if (caption && !hasVoice) {
      issues.push({
        code: 'CAPTION_WITHOUT_VOICE',
        message: `分镜 ${scene.order} 有字幕但缺少配音文件`,
        severity: 'major',
        scene: scene.order,
      })
    }

    const isStaged = (url?: string) => Boolean(url?.startsWith('renders/'))
    const image = scene.image
    if (image && !isStaged(image) && image.startsWith('/storage/')) {
      issues.push({
        code: 'UNSTAGED_IMAGE',
        message: `分镜 ${scene.order} 画面未 staging 到 Remotion public 目录`,
        severity: 'major',
        scene: scene.order,
      })
    }
    if (hasVoice && !isStaged(scene.audio) && scene.audio!.startsWith('/storage/')) {
      issues.push({
        code: 'UNSTAGED_VOICE',
        message: `分镜 ${scene.order} 配音未 staging 到 Remotion public 目录`,
        severity: 'major',
        scene: scene.order,
      })
    }
  }

  const bgm = input.backgroundMusic?.url ?? input.composition?.audio?.backgroundMusic?.url
  if (bgm?.startsWith('/storage/') && !bgm.startsWith('renders/')) {
    issues.push({
      code: 'UNSTAGED_BGM',
      message: '背景音乐未 staging 到 Remotion public 目录',
      severity: 'minor',
    })
  }

  return issues
}

export function assertRenderInputReady(input: RenderInput) {
  const issues = validateRenderInput(input)
  const critical = issues.filter((i) => i.severity === 'critical')
  if (critical.length) {
    throw new Error(critical.map((i) => i.message).join('；'))
  }
  return issues
}
