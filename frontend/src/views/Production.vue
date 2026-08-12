<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMessage } from 'naive-ui'
import { CheckCircle2, ChevronRight, Circle, Download, Loader2, Sparkles, XCircle } from 'lucide-vue-next'
import {
  cancelProduction,
  fetchProductionStatus,
  retryProduction,
  startProduction,
  type ProductionStatus,
} from '@/api/production'
import VideoOutputPlayer from '@/components/video/VideoOutputPlayer.vue'
import ReviewReport from '@/components/intelligence/ReviewReport.vue'
import { useProjectWebSocket, type ProductionEvent } from '@/composables/useProjectWebSocket'
import { useWorkspaceStore } from '@/stores/workspace'

const route = useRoute()
const router = useRouter()
const message = useMessage()
const workspaceStore = useWorkspaceStore()

const projectId = String(route.params.id)
const status = ref<ProductionStatus | null>(null)
const loading = ref(true)
const starting = ref(false)
const retrying = ref(false)
const cancelling = ref(false)
const error = ref<string | null>(null)
const completedNotified = ref(false)

const STAGES = [
  { id: 'DIRECTOR', label: '① AI 导演' },
  { id: 'SCRIPT', label: '② 故事脚本' },
  { id: 'STORYBOARD', label: '③ 电影分镜' },
  { id: 'ASSET', label: '④ 素材生成' },
  { id: 'TTS', label: '⑤ 配音合成' },
  { id: 'TIMELINE', label: '⑥ 视频合成' },
  { id: 'RENDER', label: '⑦ 渲染导出' },
]

const activePipelineIndex = computed(() => {
  if (!status.value) return -1
  if (status.value.isComplete) return STAGES.length
  const step = status.value.activeStep || status.value.stage
  if (!step) return -1
  return STAGES.findIndex((s) => s.id === step)
})

const isFailed = computed(() => status.value?.jobStatus === 'FAILED' || status.value?.jobStatus === 'CANCELLED')
const failedTitle = computed(() => (status.value?.jobStatus === 'CANCELLED' ? '生产任务已取消' : '生产任务失败'))
const isProcessing = computed(() => status.value?.isProcessing ?? false)
const isMp4 = computed(() => status.value?.videoUrl?.toLowerCase().includes('.mp4') ?? false)

function formatDuration(ms: number | null): string {
  if (ms == null) return '--'
  const s = Math.round(ms / 1000)
  if (s < 60) return `${s}s`
  const m = Math.floor(s / 60)
  return `${m}m${s % 60}s`
}

const elapsedLabel = computed(() => formatDuration(status.value?.elapsedMs ?? null))
const etaLabel = computed(() => formatDuration(status.value?.etaMs ?? null))

const stepIcon = (stepStatus: string) => {
  if (stepStatus === 'success') return CheckCircle2
  if (stepStatus === 'running') return Loader2
  if (stepStatus === 'failed') return XCircle
  return Circle
}

function downloadOutput() {
  if (!status.value?.videoUrl) return
  const link = document.createElement('a')
  link.href = status.value.videoUrl
  link.download = `${status.value.projectName}${isMp4.value ? '.mp4' : '.html'}`
  link.target = '_blank'
  link.rel = 'noopener'
  document.body.appendChild(link)
  link.click()
  link.remove()
}

function applyStatus(next: ProductionStatus) {
  status.value = next
  workspaceStore.credits = next.creditsBalance ?? next.credits
  if (next.isComplete && !completedNotified.value) {
    completedNotified.value = true
    message.success('视频渲染完成！')
  }
}

function handleWsEvent(event: ProductionEvent) {
  if (event.type === 'failed' && event.message) message.error(event.message)
  else if (event.type === 'cancelled') message.info('生产任务已取消')
  else if (event.type === 'completed') message.success('生产流水线已完成')
}

async function loadStatus() {
  try {
    applyStatus(await fetchProductionStatus(projectId, false))
  } catch (err) {
    error.value = err instanceof Error ? err.message : '加载失败'
  } finally {
    loading.value = false
  }
}

async function handleStart() {
  starting.value = true
  error.value = null
  try {
    applyStatus(await startProduction(projectId))
    void workspaceStore.loadSummary()
    message.success(`已扣除 ${status.value?.creditsDeducted ?? 280} 点，生产流水线已启动`)
  } catch (err) {
    error.value = err instanceof Error ? err.message : '启动失败'
    message.error(error.value)
  } finally {
    starting.value = false
  }
}

async function handleRetry() {
  retrying.value = true
  error.value = null
  try {
    applyStatus(await retryProduction(projectId))
    message.success('已重新启动生产任务')
  } catch (err) {
    error.value = err instanceof Error ? err.message : '重试失败'
    message.error(error.value)
  } finally {
    retrying.value = false
  }
}

async function handleCancel() {
  cancelling.value = true
  try {
    applyStatus(await cancelProduction(projectId))
    message.info('已取消生产任务')
  } catch (err) {
    message.error(err instanceof Error ? err.message : '取消失败')
  } finally {
    cancelling.value = false
  }
}

useProjectWebSocket(projectId, applyStatus, handleWsEvent, loadStatus)

let pollTimer: number | undefined

onMounted(async () => {
  await loadStatus()
  pollTimer = window.setInterval(() => {
    if (status.value?.isComplete) return
    void loadStatus()
  }, 5000)
})

onUnmounted(() => {
  if (pollTimer) window.clearInterval(pollTimer)
})
</script>

<template>
  <div class="flex flex-col h-[calc(100vh-3.5rem)] bg-dark overflow-hidden">
    <div class="h-11 glass-panel mx-4 mt-3 mb-0 px-4 flex items-center justify-between shrink-0 border-border/60">
      <div class="flex items-center gap-3">
        <Sparkles class="w-4 h-4 text-accent-purple" />
        <span class="text-sm font-semibold text-white">AI 生产流水线</span>
        <span class="text-[10px] font-mono text-muted truncate max-w-[200px]">{{ status?.projectName ?? projectId }}</span>
      </div>
      <span
        v-if="status"
        class="px-2 py-0.5 text-[10px] font-mono rounded-lg flex items-center gap-1"
        :class="
          status.isComplete
            ? 'bg-success/10 border border-success/30 text-success'
            : isFailed
              ? 'bg-danger/10 border border-danger/30 text-danger'
              : status.isProcessing
                ? 'bg-accent-blue/10 border border-accent-blue/30 text-accent-blue'
                : 'bg-card border border-border text-muted'
        "
      >
        <Loader2 v-if="status.isProcessing" class="w-3 h-3 animate-spin" />
        {{ status.isComplete ? '已完成' : isFailed ? failedTitle : status.isProcessing ? '处理中' : '准备中' }}
      </span>
    </div>

    <div class="shrink-0 px-6 py-3 flex items-center gap-1 overflow-x-auto">
      <template v-for="(item, idx) in STAGES" :key="item.id">
        <span
          class="px-3 py-1 rounded-lg text-xs font-medium shrink-0 transition-all"
          :class="
            idx === activePipelineIndex
              ? 'bg-gradient-ai text-white shadow-glow-blue'
              : idx < activePipelineIndex || status?.isComplete
                ? 'text-success'
                : isFailed && idx === activePipelineIndex
                  ? 'text-danger'
                  : 'text-muted'
          "
        >
          {{ item.label }}
        </span>
        <ChevronRight v-if="idx < STAGES.length - 1" class="w-3.5 h-3.5 text-border shrink-0" />
      </template>
    </div>

    <div v-if="loading" class="flex-1 flex items-center justify-center text-muted text-sm">加载生产状态...</div>
    <div v-else-if="error && !status" class="flex-1 flex flex-col items-center justify-center gap-4 p-6">
      <p class="text-danger text-sm m-0">{{ error }}</p>
      <button class="btn-ai-gradient px-4 py-2 rounded-xl text-sm" @click="handleStart">重试启动</button>
    </div>

    <div
      v-else-if="status && !status.isProcessing && !status.isComplete && !status.jobStatus"
      class="flex-1 flex flex-col items-center justify-center gap-4 p-6"
    >
      <Sparkles class="w-8 h-8 text-accent-purple" />
      <p class="text-sm text-muted m-0">该项目尚未启动生产流水线</p>
      <button
        class="btn-ai-gradient px-5 h-10 rounded-xl text-sm font-semibold disabled:opacity-50"
        :disabled="starting"
        @click="handleStart"
      >
        <Loader2 v-if="starting" class="w-4 h-4 animate-spin inline" />
        开始生产
      </button>
    </div>

    <div v-else-if="status && (status.jobStatus || status.isComplete)" class="flex-1 flex min-h-0 overflow-hidden px-4 pb-4 gap-4">
      <div class="flex-1 space-y-4 overflow-y-auto min-h-0">
        <div class="glass-panel p-5 space-y-3">
          <div class="flex items-center justify-between text-sm">
            <span class="text-white font-medium">总体进度</span>
            <span class="font-mono text-accent-blue font-bold">{{ status.overallProgress }}%</span>
          </div>
          <div class="w-full bg-dark h-2 rounded-full overflow-hidden border border-border">
            <div
              class="h-full transition-all duration-500"
              :class="isFailed ? 'bg-danger' : 'bg-gradient-ai'"
              :style="{ width: `${status.overallProgress}%` }"
            />
          </div>
          <div class="flex justify-between text-[11px] text-muted font-mono">
            <span>已耗时：{{ elapsedLabel }}<span v-if="status.etaMs && status.isProcessing" class="ml-2">预计剩余：{{ etaLabel }}</span></span>
            <span>剩余 AI 点数：{{ status.credits.toLocaleString() }}</span>
          </div>
        </div>

        <div v-if="isFailed" class="glass-panel p-4 border-danger/40 flex items-center justify-between gap-3">
          <div class="text-xs text-danger min-w-0">
            <p class="font-semibold m-0">{{ failedTitle }}</p>
            <p class="text-muted m-0 mt-1 truncate">{{ status.errorMeta?.message ?? status.error ?? '未知错误' }}</p>
            <p v-if="status.errorMeta?.step" class="text-muted m-0 mt-0.5 font-mono text-[10px]">
              步骤：{{ status.errorMeta.step }} · 可重试：{{ status.errorMeta.retryable ? '是' : '否' }}
            </p>
          </div>
          <button
            class="btn-ai-gradient px-4 h-9 rounded-lg text-xs font-semibold disabled:opacity-50 shrink-0"
            :disabled="retrying"
            @click="handleRetry"
          >
            <Loader2 v-if="retrying" class="w-3.5 h-3.5 animate-spin" />
            重新开始
          </button>
        </div>

        <div class="space-y-2">
          <div
            v-for="step in status.steps"
            :key="step.key"
            class="glass-panel flex items-center gap-4 p-4 transition-all"
            :class="step.status === 'running' ? 'border-accent-blue/40 shadow-glow-blue' : step.status === 'failed' ? 'border-danger/40' : ''"
          >
            <component
              :is="stepIcon(step.status)"
              class="w-5 h-5 shrink-0"
              :class="{
                'text-success': step.status === 'success',
                'text-accent-blue animate-spin': step.status === 'running',
                'text-danger': step.status === 'failed',
                'text-border': step.status === 'waiting',
              }"
            />
            <div class="flex-1 min-w-0">
              <div
                class="text-sm font-medium"
                :class="{
                  'text-success': step.status === 'success',
                  'text-accent-blue': step.status === 'running',
                  'text-muted': step.status === 'waiting',
                  'text-danger': step.status === 'failed',
                }"
              >
                {{ step.label }}
                <span v-if="step.retryCount > 0" class="ml-2 text-[10px] font-mono text-warning">重试 {{ step.retryCount }}</span>
              </div>
              <div v-if="step.status === 'running'" class="mt-2 h-1 bg-dark rounded-full overflow-hidden">
                <div class="h-full bg-accent-blue transition-all" :style="{ width: `${step.progress}%` }" />
              </div>
            </div>
            <span v-if="step.time" class="text-[10px] font-mono text-muted shrink-0">{{ step.time }}</span>
          </div>
        </div>
      </div>

      <aside class="w-80 shrink-0 flex flex-col gap-4 min-h-0 overflow-hidden">
        <div v-if="status.isComplete && status.videoUrl" class="glass-panel p-4 shrink-0 space-y-3">
          <div class="flex items-center justify-between">
            <span class="text-[11px] font-mono font-semibold text-muted uppercase">成片预览</span>
            <span class="text-[10px] font-mono px-1.5 py-0.5 rounded" :class="isMp4 ? 'text-success bg-success/10' : 'text-warning bg-warning/10'">
              {{ isMp4 ? 'MP4' : 'HTML' }}
            </span>
          </div>
          <VideoOutputPlayer :url="status.videoUrl" ratio="9:16" :title="status.projectName" />
          <button type="button" class="btn-soft btn-soft--primary w-full !h-9 !text-xs" @click="downloadOutput">
            <Download class="w-3.5 h-3.5" />
            {{ isMp4 ? '下载 MP4' : '下载预览' }}
          </button>
        </div>

        <ReviewReport
          v-if="status.isComplete && isMp4"
          :project-id="projectId"
          :is-complete="status.isComplete"
          :is-mp4="isMp4"
          auto-review
          @rerender-started="loadStatus"
        />

        <div class="glass-panel flex flex-col overflow-hidden flex-1 min-h-0">
          <div class="px-4 py-3 border-b border-border text-[11px] font-mono font-semibold text-muted uppercase">实时日志</div>
          <div class="flex-1 overflow-y-auto p-4 space-y-3">
            <div v-for="(log, i) in status.logs" :key="i" class="flex gap-3 text-xs">
              <span class="font-mono text-muted shrink-0">{{ log.time }}</span>
              <span class="text-muted leading-relaxed">{{ log.message }}</span>
            </div>
          </div>
        </div>
      </aside>
    </div>

    <footer class="shrink-0 h-14 flex items-center justify-between px-6 border-t border-border bg-surface/80 mx-4 mb-4 rounded-xl">
      <div class="flex items-center gap-2">
        <button class="px-4 h-9 glass-panel rounded-lg text-xs text-muted hover:text-white" @click="router.push({ name: 'video-plan', params: { id: projectId } })">
          返回编辑
        </button>
        <button
          v-if="isProcessing"
          class="px-4 h-9 glass-panel rounded-lg text-xs text-danger hover:text-white disabled:opacity-50"
          :disabled="cancelling"
          @click="handleCancel"
        >
          <Loader2 v-if="cancelling" class="w-3.5 h-3.5 animate-spin inline" />
          取消任务
        </button>
      </div>
      <button
        class="px-5 h-9 btn-ai-gradient rounded-lg text-xs font-semibold disabled:opacity-50"
        :disabled="!status?.isComplete"
        @click="router.push({ name: 'video-detail', params: { id: projectId } })"
      >
        {{ status?.isComplete ? '查看成品 →' : `渲染中 ${status?.overallProgress ?? 0}%` }}
      </button>
    </footer>
  </div>
</template>
