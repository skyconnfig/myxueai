<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMessage } from 'naive-ui'
import { ArrowLeft, Download, Sparkles, Wrench } from 'lucide-vue-next'
import type { VideoReviewRecord } from '@xueai/shared'
import ReviewReport from '@/components/intelligence/ReviewReport.vue'
import VideoOutputPlayer from '@/components/video/VideoOutputPlayer.vue'
import { fetchProductionStatus } from '@/api/production'
import { fetchLatestReview, reviewProject } from '@/api/review'
import { useProjectStore } from '@/stores/project'

const route = useRoute()
const router = useRouter()
const message = useMessage()
const projectStore = useProjectStore()

const projectId = String(route.params.id)
const review = ref<VideoReviewRecord | null>(null)
const loading = ref(true)
const videoUrl = ref<string | null>(null)

const isMp4 = computed(() => videoUrl.value?.toLowerCase().includes('.mp4') ?? false)

onMounted(async () => {
  loading.value = true
  try {
    await projectStore.loadProject(projectId)
    const status = await fetchProductionStatus(projectId, false)
    videoUrl.value = status.videoUrl ?? projectStore.currentProject?.videoUrl ?? null
    review.value = await fetchLatestReview(projectId)
  } catch (err) {
    message.error(err instanceof Error ? err.message : '加载审片数据失败')
  } finally {
    loading.value = false
  }
})

async function rerunReview() {
  try {
    const result = await reviewProject(projectId)
    review.value = {
      id: result.id ?? '',
      projectId,
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
  }
}

function downloadVideo() {
  if (!videoUrl.value) return
  window.open(videoUrl.value, '_blank', 'noopener')
}
</script>

<template>
  <div class="p-6 max-w-5xl mx-auto space-y-6">
    <div class="flex items-center gap-3">
      <button type="button" class="btn-soft !h-9 !px-3" @click="router.back()">
        <ArrowLeft class="w-4 h-4" />
        返回
      </button>
      <div>
        <h1 class="text-xl font-bold text-white m-0">AI 审片中心</h1>
        <p class="text-sm text-muted m-0">{{ projectStore.currentProject?.name ?? projectId }}</p>
      </div>
    </div>

    <div v-if="loading" class="glass-panel p-12 text-center text-muted text-sm">加载审片报告...</div>

    <div v-else class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div class="glass-panel p-5 space-y-4">
        <div class="flex items-center justify-between">
          <span class="text-sm font-semibold text-white">成片预览</span>
          <button
            v-if="videoUrl"
            type="button"
            class="btn-soft !h-8 !px-3 !text-xs"
            @click="downloadVideo"
          >
            <Download class="w-3.5 h-3.5" />
            下载
          </button>
        </div>
        <VideoOutputPlayer
          v-if="videoUrl"
          :url="videoUrl"
          :ratio="projectStore.currentProject?.ratio ?? '9:16'"
          :title="projectStore.currentProject?.name"
        />
        <p v-else class="text-sm text-muted m-0">项目尚未完成渲染，请先走完生产流水线。</p>
      </div>

      <div class="space-y-4">
        <ReviewReport
          :project-id="projectId"
          :is-complete="Boolean(videoUrl)"
          :is-mp4="isMp4"
          @rerender-started="router.push({ name: 'production', params: { id: projectId } })"
        />

        <div class="glass-panel p-4 flex flex-wrap gap-2">
          <button type="button" class="btn-soft btn-soft--primary !h-9 !text-xs" @click="rerunReview">
            <Sparkles class="w-3.5 h-3.5" />
            重新审片
          </button>
          <button
            type="button"
            class="btn-soft !h-9 !text-xs"
            @click="router.push({ name: 'production', params: { id: projectId } })"
          >
            <Wrench class="w-3.5 h-3.5" />
            生产流水线
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
