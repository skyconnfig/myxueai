import type { Prisma } from '@prisma/client'
import type { VideoReviewIssueV2, VideoReviewResultV2, VideoReviewScoresV2 } from '@xueai/shared'
import path from 'node:path'
import { prisma } from '../../config/database.js'
import { storagePaths } from '../../config/storage.js'
import { AppError } from '../../middleware/error-handler.js'
import { openAICompatibleProvider } from '../ai/providers/openai-compatible.provider.js'
import { twelveLabsProvider } from './providers/twelvelabs.provider.js'
import { reviewFixService } from './review-fix.service.js'

function averageScore(scores: VideoReviewScoresV2) {
  const values = Object.values(scores)
  return Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10
}

function toScore100(value: number) {
  return value <= 10 ? value * 10 : value
}

function buildRuleIssues(scenes: Array<{
  order: number
  duration: number
  cameraMotion: string | null
  transition: string | null
  videoUrl: string | null
  viewerTask: string | null
}>): VideoReviewIssueV2[] {
  const issues: VideoReviewIssueV2[] = []
  let staticStreak = 0

  for (const scene of scenes) {
    const isStatic = !scene.cameraMotion || scene.cameraMotion === 'static'
    staticStreak = isStatic ? staticStreak + 1 : 0

    if (scene.duration >= 5 && isStatic && !scene.videoUrl) {
      issues.push({
        scene: scene.order,
        severity: 'major',
        problem: `镜头 ${scene.order} 静止超过 ${scene.duration} 秒`,
        reason: '缺少摄影机运动或 B-roll',
        solution: '增加 tracking shot 或绑定 Pexels B-roll',
      })
    }
    if (staticStreak >= 3) {
      issues.push({
        scene: scene.order,
        severity: 'critical',
        problem: '连续三镜缺少有效运动',
        reason: 'xueai QC: 连续静态镜头',
        solution: '交替使用 push_in、tracking 与 broll_video 组件',
      })
      staticStreak = 0
    }
    if (!scene.viewerTask) {
      issues.push({
        scene: scene.order,
        severity: 'minor',
        problem: `分镜 ${scene.order} 缺少观看任务定义`,
        solution: '补充 viewerTask / input / process / result',
      })
    }
  }

  const cutOnly = scenes.every((s) => !s.transition || s.transition === 'cut')
  if (cutOnly && scenes.length > 2) {
    issues.push({
      scene: 0,
      severity: 'minor',
      problem: '转场全部为硬切',
      solution: '在 solution/result 段使用 crossfade 或 push',
    })
  }

  return issues
}

function fallbackScores(issues: VideoReviewIssueV2[]): VideoReviewScoresV2 {
  const penalty = issues.filter((i) => i.severity === 'critical').length * 15
    + issues.filter((i) => i.severity === 'major').length * 8
  const base = Math.max(40, 85 - penalty)
  return {
    plasticFeeling: base - 5,
    commercialQuality: base,
    motionQuality: base - 10,
    storyClarity: base + 5,
    audioQuality: base,
  }
}

export class ReviewService {
  private async analyzeWithTwelveLabs(videoLocalPath: string) {
    if (!twelveLabsProvider.isConfigured) return null
    const indexId = await twelveLabsProvider.ensureIndex()
    const task = await twelveLabsProvider.uploadVideo(indexId, videoLocalPath)
    if (!task._id) return null
    const ready = await twelveLabsProvider.waitForTask(task._id)
    if (!ready.video_id) return null

    const prompt = `Analyze this commercial video. Return JSON with issues array: [{scene, problem, reason, solution, severity}]. Check: plastic AI look, static shots over 5s, PPT-like slides, weak hook, pacing, audio-visual sync. Also score 0-100: plasticFeeling, commercialQuality, motionQuality, storyClarity, audioQuality.`
    const analysis = await twelveLabsProvider.analyze(indexId, ready.video_id, prompt)
    return { indexId, videoId: ready.video_id, raw: analysis }
  }

  private async analyzeWithLlm(scenes: unknown[], directorBrief: unknown, hasVideo: boolean) {
    if (!openAICompatibleProvider.isConfigured) return null
    const raw = await openAICompatibleProvider.generateRawJson(
      `Review commercial video metadata. Has MP4: ${hasVideo}. Director: ${JSON.stringify(directorBrief)}. Scenes: ${JSON.stringify(scenes)}. Return JSON: { scores: { plasticFeeling, commercialQuality, motionQuality, storyClarity, audioQuality (0-100) }, strengths: [], issues: [{ scene, severity, problem, reason, solution }], priorityFix, verdict }`,
      'Commercial post-producer. JSON only.',
    )
    return raw as VideoReviewResultV2
  }

  async reviewProject(projectId: string, options?: { renderId?: string; force?: boolean }) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { scenes: { orderBy: { order: 'asc' } }, renders: { orderBy: { createdAt: 'desc' }, take: 1 } },
    })
    if (!project) throw new AppError(404, 'PROJECT_NOT_FOUND', '项目不存在')
    if (project.scenes.length === 0) throw new AppError(400, 'NO_SCENES', '请先生成分镜')

    const render = options?.renderId
      ? await prisma.render.findUnique({ where: { id: options.renderId } })
      : project.renders[0]

    const scenePayload = project.scenes.map((s) => ({
      order: s.order,
      duration: s.duration,
      storyBeat: s.storyBeat,
      shotType: s.shotType,
      cameraMotion: s.cameraMotion,
      transition: s.transition,
      videoUrl: s.videoUrl,
      viewerTask: s.viewerTask,
      voiceText: s.voiceText,
    }))

    const ruleIssues = buildRuleIssues(scenePayload)
    let scores = fallbackScores(ruleIssues)
    let issues = ruleIssues
    let strengths: string[] = ['故事结构包含商业模板 beats']
    let priorityFix = ruleIssues[0]?.solution ?? '增强首镜 Hook 与运镜'
    let source = 'rules'
    let rawAnalysis: unknown = null
    let tlIndexId: string | null = null
    let tlVideoId: string | null = null

    const llm = await this.analyzeWithLlm(scenePayload, project.directorBrief, Boolean(project.videoUrl))
    if (llm?.scores) {
      scores = {
        plasticFeeling: toScore100(Number(llm.scores.plasticFeeling ?? scores.plasticFeeling)),
        commercialQuality: toScore100(Number(llm.scores.commercialQuality ?? scores.commercialQuality)),
        motionQuality: toScore100(Number(llm.scores.motionQuality ?? scores.motionQuality)),
        storyClarity: toScore100(Number(llm.scores.storyClarity ?? scores.storyClarity)),
        audioQuality: toScore100(Number(llm.scores.audioQuality ?? scores.audioQuality)),
      }
      issues = [...ruleIssues, ...(llm.issues ?? [])]
      strengths = llm.strengths ?? strengths
      priorityFix = llm.priorityFix ?? priorityFix
      source = 'hybrid'
    }

    if (render?.outputUrl && render.outputUrl.startsWith('/storage/')) {
      const rel = render.outputUrl.replace(/^\/storage\//, '')
      const fullPath = path.join(storagePaths.root, rel)
      try {
        const tl = await this.analyzeWithTwelveLabs(fullPath)
        if (tl) {
          tlIndexId = tl.indexId
          tlVideoId = tl.videoId
          rawAnalysis = tl.raw
          source = 'hybrid+twelvelabs'
        }
      } catch {
        // TwelveLabs optional
      }
    }

    const overallScore = averageScore(scores)
    const verdict = issues.some((i) => i.severity === 'critical' || i.severity === 'major')
      ? 'NEEDS_REVISION'
      : overallScore >= 75
        ? 'APPROVED'
        : 'NEEDS_REVISION'

    const record = await prisma.videoReview.create({
      data: {
        projectId,
        renderId: render?.id,
        source,
        scores: scores as unknown as Prisma.InputJsonValue,
        issues: issues as unknown as Prisma.InputJsonValue,
        strengths: strengths as unknown as Prisma.InputJsonValue,
        overallScore,
        verdict,
        priorityFix,
        twelvelabsIndexId: tlIndexId,
        twelvelabsVideoId: tlVideoId,
        rawAnalysis: rawAnalysis ?? undefined,
      },
    })

    await prisma.project.update({
      where: { id: projectId },
      data: {
        reviewScore: overallScore,
        reviewVerdict: verdict,
        lastReviewId: record.id,
      },
    })

    return {
      id: record.id,
      scores,
      overallScore,
      strengths,
      issues,
      priorityFix,
      verdict,
      source,
      createdAt: record.createdAt.toISOString(),
    } satisfies VideoReviewResultV2 & { id: string; createdAt: string }
  }

  async getLatestReview(projectId: string) {
    const review = await prisma.videoReview.findFirst({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
    })
    if (!review) return null
    return {
      id: review.id,
      projectId: review.projectId,
      renderId: review.renderId,
      source: review.source,
      scores: review.scores as unknown as VideoReviewScoresV2,
      issues: review.issues as unknown as VideoReviewIssueV2[],
      strengths: (review.strengths as string[]) ?? [],
      overallScore: review.overallScore,
      verdict: review.verdict as 'APPROVED' | 'NEEDS_REVISION',
      priorityFix: review.priorityFix ?? '',
      createdAt: review.createdAt.toISOString(),
    }
  }

  async applyFix(projectId: string, reviewId?: string) {
    return reviewFixService.applyFromReview(projectId, reviewId)
  }

  async rerenderAfterFix(projectId: string) {
    return reviewFixService.rerender(projectId)
  }
}

export const reviewService = new ReviewService()
