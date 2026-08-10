<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useMessage } from 'naive-ui'
import { AlertTriangle, CheckCircle2, Loader2, Sparkles, Wrench } from 'lucide-vue-next'
import type { VideoReviewRecord } from '@xueai/shared'
import { applyReviewFix, fetchLatestReview, reviewProject } from '@/api/review'

const props = defineProps<{
  projectId: string
  autoReview?: boolean
  isComplete?: boolean
  isMp4?: boolean
}>()

const emit = defineEmits<{
  optimized: []
  rerenderStarted: []
}>()

const message = useMessage()
const review = ref<VideoReviewRecord | null>(null)
const loading = ref(false)
const fixing = ref(false)
const autoTriggered = ref(false)

const scoreDimensions = [
  { key: 'plasticFeeling', label: '塑料感', invert: true },
  { key: 'commercialQuality', label: '商业质感', invert: false },
  { key: 'motionQuality', label: '运镜动效', invert: false },
  { key: 'storyClarity', label: '故事清晰', invert: false },
  { key: 'audioQuality', label: '音画质量', invert: false },
] as const

const verdictClass = computed(() => {
  if (!review.value) return 'text-muted'
  return review.value.verdict === 'APPROVED' ? 'text-success' : 'text-warning'
})

const severityClass: Record<string, string> = {
  critical: 'border-danger/40 bg-danger/10 text-danger',
  major: 'border-warning/40 bg-warning/10 text-warning',
  minor: 'border-border bg-dark/40 text-muted',
}

async function loadReview() {
  loading.value = true
  try {
    review.value = await fetchLatestReview(props.projectId)
  } catch {
    review.value = null
  } finally {
    loading.value = false
  }
}

async function runReview() {
  loading.value = true
  try {
    const result = await reviewProject(props.projectId)
    review.value = {
      id: result.id ?? '',
      projectId: props.projectId,
      source: result.source ?? 'hybrid',
      scores: result.scores,
      issues: result.issues,
      strengths: result.strengths,
      overallScore: result.overallScore,
      verdict: result.verdict,
      priorityFix: result.priorityFix,
      createdAt: result.createdAt ?? new Date().toISOString(),
    }
    message.success('审片完成')
  } catch (err) {
    message.error(err instanceof Error ? err.message : '审片失败')
  } finally {
    loading.value = false
  }
}

async function handleFix() {
  if (!review.value) return
  fixing.value = true
  try {
    const result = await applyReviewFix(props.projectId, {
      reviewId: review.value.id,
      rerender: true,
    })
    message.success(`已应用 ${result.patches.length} 处优化，正在重渲染`)
    emit('optimized')
    emit('rerenderStarted')
  } catch (err) {
    message.error(err instanceof Error ? err.message : '优化失败')
  } finally {
    fixing.value = false
  }
}

watch(
  () => [props.isComplete, props.isMp4, props.autoReview] as const,
  async ([complete, mp4, auto]) => {
    if (complete && mp4 && auto && !autoTriggered.value) {
      autoTriggered.value = true
      await loadReview()
      if (!review.value) await runReview()
    }
  },
  { immediate: true },
)

defineExpose({ loadReview, runReview })
</script>

<template>
  <div class="glass-panel p-4 shrink-0 space-y-3">
    <div class="flex items-center justify-between">
      <span class="text-[11px] font-mono font-semibold text-muted uppercase flex items-center gap-1.5">
        <Sparkles class="w-3.5 h-3.5 text-accent-purple" />
        AI 审片报告
      </span>
      <button
        type="button"
        class="text-[10px] font-mono text-accent-blue hover:underline disabled:opacity-50"
        :disabled="loading"
        @click="runReview"
      >
        {{ loading ? '分析中...' : '重新审片' }}
      </button>
    </div>

    <div v-if="loading && !review" class="flex items-center justify-center py-8 text-muted text-xs gap-2">
      <Loader2 class="w-4 h-4 animate-spin" />
      正在分析成片...
    </div>

    <template v-else-if="review">
      <div class="flex items-center gap-4">
        <div
          class="relative w-16 h-16 rounded-full flex items-center justify-center shrink-0"
          :class="review.verdict === 'APPROVED' ? 'bg-success/10 border border-success/30' : 'bg-warning/10 border border-warning/30'"
        >
          <span class="text-xl font-bold font-mono" :class="verdictClass">{{ Math.round(review.overallScore) }}</span>
        </div>
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2">
            <component
              :is="review.verdict === 'APPROVED' ? CheckCircle2 : AlertTriangle"
              class="w-4 h-4"
              :class="verdictClass"
            />
            <span class="text-sm font-semibold text-white">
              {{ review.verdict === 'APPROVED' ? '通过' : '需修订' }}
            </span>
          </div>
          <p class="text-[11px] text-muted m-0 mt-1 line-clamp-2">{{ review.priorityFix }}</p>
        </div>
      </div>

      <div class="space-y-1.5">
        <div
          v-for="dim in scoreDimensions"
          :key="dim.key"
          class="flex items-center gap-2 text-[10px]"
        >
          <span class="w-16 text-muted shrink-0">{{ dim.label }}</span>
          <div class="flex-1 h-1.5 bg-dark rounded-full overflow-hidden">
            <div
              class="h-full rounded-full transition-all"
              :class="dim.invert ? 'bg-warning' : 'bg-accent-blue'"
              :style="{ width: `${review.scores[dim.key]}%` }"
            />
          </div>
          <span class="w-8 text-right font-mono text-muted">{{ Math.round(review.scores[dim.key]) }}</span>
        </div>
      </div>

      <div v-if="review.issues.length" class="space-y-1.5 max-h-36 overflow-y-auto">
        <div
          v-for="(issue, idx) in review.issues.slice(0, 6)"
          :key="idx"
          class="px-2 py-1.5 rounded-lg border text-[10px]"
          :class="severityClass[issue.severity] ?? severityClass.minor"
        >
          <span class="font-mono">S{{ issue.scene }}</span>
          · {{ issue.problem }}
        </div>
      </div>

      <button
        v-if="review.verdict === 'NEEDS_REVISION'"
        type="button"
        class="btn-soft btn-soft--primary w-full !h-9 !text-xs disabled:opacity-50"
        :disabled="fixing"
        @click="handleFix"
      >
        <Wrench class="w-3.5 h-3.5" />
        {{ fixing ? '优化中...' : '一键优化并重渲染' }}
      </button>
    </template>

    <p v-else class="text-[11px] text-muted m-0 text-center py-4">
      渲染完成后将自动审片
    </p>
  </div>
</template>
