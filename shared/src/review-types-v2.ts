export interface VideoReviewScoresV2 {
  plasticFeeling: number
  commercialQuality: number
  motionQuality: number
  storyClarity: number
  audioQuality: number
}

export interface VideoReviewIssueV2 {
  scene: number
  severity: 'critical' | 'major' | 'minor'
  problem: string
  reason?: string
  solution: string
}

export interface VideoReviewRecord {
  id: string
  projectId: string
  renderId?: string | null
  source: string
  scores: VideoReviewScoresV2
  issues: VideoReviewIssueV2[]
  strengths: string[]
  overallScore: number
  verdict: 'APPROVED' | 'NEEDS_REVISION'
  priorityFix: string
  createdAt: string
}

export interface VideoReviewResultV2 {
  id?: string
  scores: VideoReviewScoresV2
  overallScore: number
  strengths: string[]
  issues: VideoReviewIssueV2[]
  priorityFix: string
  verdict: 'APPROVED' | 'NEEDS_REVISION'
  source?: string
}
