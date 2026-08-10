export interface VideoReviewScores {
  visualQuality: number
  storytelling: number
  commercialFeeling: number
  pacing: number
  audioQuality: number
  aiArtifactScore: number
}

export interface VideoReviewIssue {
  severity: 'critical' | 'major' | 'minor'
  problem: string
  solution: string
  sceneOrder?: number
}

export interface VideoReviewResult {
  scores: VideoReviewScores
  overallScore: number
  strengths: string[]
  issues: VideoReviewIssue[]
  priorityFix: string
  verdict: 'APPROVED' | 'NEEDS_REVISION'
}
