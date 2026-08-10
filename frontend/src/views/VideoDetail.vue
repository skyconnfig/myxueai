<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMessage } from 'naive-ui'
import { Copy, Download, Film, Loader2, RefreshCw, Share2 } from 'lucide-vue-next'
import VideoOutputPlayer from '@/components/video/VideoOutputPlayer.vue'
import { useProjectStore } from '@/stores/project'
import { RATIO_DIMENSIONS } from '@xueai/shared'

const route = useRoute()
const router = useRouter()
const message = useMessage()
const projectStore = useProjectStore()

const projectId = String(route.params.id)
const copying = ref(false)

const project = computed(() => projectStore.currentProject)
const loading = computed(() => projectStore.loading)

const dims = computed(() => RATIO_DIMENSIONS[project.value?.ratio ?? '9:16'] ?? RATIO_DIMENSIONS['9:16'])
const isMp4 = computed(() => project.value?.videoUrl?.toLowerCase().includes('.mp4') ?? false)

const statusLabel = computed(() => {
  const s = project.value?.status
  if (s === 'COMPLETED') return isMp4.value ? 'MP4 就绪' : '预览就绪'
  if (s === 'RENDERING' || s === 'GENERATING') return '生产中'
  if (s === 'FAILED') return '失败'
  return '草稿'
})

const statusClass = computed(() => {
  if (project.value?.status === 'COMPLETED') return 'bg-success/10 border-success/30 text-success'
  if (project.value?.status === 'FAILED') return 'bg-danger/10 border-danger/30 text-danger'
  if (project.value?.status === 'RENDERING' || project.value?.status === 'GENERATING') {
    return 'bg-accent-blue/10 border-accent-blue/30 text-accent-blue'
  }
  return 'bg-card border-border text-muted'
})

const meta = computed(() => {
  if (!project.value) return []
  return [
    { label: '分辨率', value: `${dims.value.width} × ${dims.value.height}` },
    { label: '比例', value: project.value.ratio },
    { label: '时长', value: `${project.value.duration}s` },
    { label: '帧率', value: '30 fps' },
    { label: '格式', value: isMp4.value ? 'MP4 / H.264' : project.value.videoUrl ? 'HTML 预览' : '—' },
    { label: '分镜数', value: String(project.value.scenes.length) },
  ]
})

onMounted(() => {
  void projectStore.loadProject(projectId)
})

function downloadVideo() {
  if (!project.value?.videoUrl) {
    message.warning('暂无成片可下载')
    return
  }
  const link = document.createElement('a')
  link.href = project.value.videoUrl
  link.download = `${project.value.name}${isMp4.value ? '.mp4' : '.html'}`
  link.target = '_blank'
  link.rel = 'noopener'
  document.body.appendChild(link)
  link.click()
  link.remove()
}

async function copyProject() {
  if (!project.value || copying.value) return
  copying.value = true
  try {
    const created = await projectStore.addProject({
      prompt: project.value.prompt,
      ratio: project.value.ratio,
      duration: project.value.duration,
      style: project.value.style ?? undefined,
    })
    message.success('已复制为新项目')
    await router.push({ name: 'video-plan', params: { id: created.id } })
  } catch (err) {
    message.error(err instanceof Error ? err.message : '复制失败')
  } finally {
    copying.value = false
  }
}

function shareVideo() {
  if (!project.value?.videoUrl) {
    message.warning('暂无成片链接')
    return
  }
  const url = `${window.location.origin}${project.value.videoUrl}`
  void navigator.clipboard.writeText(url).then(() => message.success('成片链接已复制'))
}

function regenerate() {
  void router.push({ name: 'production', params: { id: projectId } })
}
</script>

<template>
  <div class="p-6 max-w-6xl mx-auto space-y-6">
    <div v-if="loading && !project" class="flex items-center justify-center min-h-64 text-muted gap-2">
      <Loader2 class="w-5 h-5 animate-spin" />
      加载项目...
    </div>

    <template v-else-if="project">
      <div class="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
        <div class="space-y-2">
          <span class="px-2 py-0.5 text-[10px] font-mono rounded border" :class="statusClass">
            {{ statusLabel }}
          </span>
          <h1 class="text-2xl font-bold text-white m-0">{{ project.name }}</h1>
          <p class="text-sm text-muted m-0">
            {{ project.style || '未设置风格' }} · 更新于 {{ new Date(project.updatedAt).toLocaleString('zh-CN') }}
          </p>
        </div>
        <div class="flex flex-wrap gap-2">
          <button
            type="button"
            class="btn-soft !h-8 !px-3 !text-xs"
            :disabled="!project.videoUrl"
            @click="shareVideo"
          >
            <Share2 class="w-3.5 h-3.5" /> 分享链接
          </button>
          <button
            type="button"
            class="btn-soft !h-8 !px-3 !text-xs"
            :disabled="copying"
            @click="copyProject"
          >
            <Copy class="w-3.5 h-3.5" /> {{ copying ? '复制中...' : '复制项目' }}
          </button>
          <button type="button" class="btn-soft !h-8 !px-3 !text-xs" @click="regenerate">
            <RefreshCw class="w-3.5 h-3.5" /> 重新生产
          </button>
          <button
            type="button"
            class="btn-soft btn-soft--primary !h-8 !px-3 !text-xs"
            :disabled="!project.videoUrl"
            @click="downloadVideo"
          >
            <Download class="w-3.5 h-3.5" /> {{ isMp4 ? '下载 MP4' : '下载预览' }}
          </button>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div class="lg:col-span-3 glass-panel p-6 flex items-center justify-center min-h-96">
          <VideoOutputPlayer
            :url="project.videoUrl"
            :ratio="project.ratio"
            :title="project.name"
          >
            <template #empty>
              <Film class="w-8 h-8 opacity-40" />
              <span>暂无成片</span>
              <button type="button" class="btn-soft btn-soft--primary !h-9 !px-4 !text-xs mt-2" @click="regenerate">
                开始生产
              </button>
            </template>
          </VideoOutputPlayer>
        </div>

        <div class="lg:col-span-2 space-y-4">
          <div class="glass-panel p-5 space-y-3">
            <h3 class="text-[11px] font-mono font-semibold text-muted uppercase m-0">视频参数</h3>
            <div v-for="item in meta" :key="item.label" class="flex justify-between text-sm">
              <span class="text-muted">{{ item.label }}</span>
              <span class="text-white font-mono text-xs">{{ item.value }}</span>
            </div>
          </div>
          <button
            type="button"
            class="w-full py-2.5 btn-soft !h-auto !text-xs"
            @click="router.push({ name: 'video-plan', params: { id: projectId } })"
          >
            返回 Studio 编辑
          </button>
        </div>
      </div>
    </template>

    <div v-else class="text-center text-muted py-16">
      项目不存在或加载失败
    </div>
  </div>
</template>
