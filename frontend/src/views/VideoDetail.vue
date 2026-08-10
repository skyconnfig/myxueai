<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Copy, Download, Film, RefreshCw, Share2 } from 'lucide-vue-next'
import { useStudioStore } from '@/stores/studio'

const route = useRoute()
const router = useRouter()
const studioStore = useStudioStore()
const projectId = String(route.params.id)

const project = computed(() => studioStore.getProjectById(projectId))
const previewScene = computed(() => project.value.scenes[0])

const meta = [
  { label: '分辨率', value: '1080 × 1920' },
  { label: '比例', value: project.value.ratio },
  { label: '时长', value: `${project.value.duration}s` },
  { label: '帧率', value: '30 fps' },
  { label: '格式', value: 'MP4 / H.264' },
]
</script>

<template>
  <div class="p-6 max-w-6xl mx-auto space-y-6">
    <div class="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
      <div class="space-y-2">
        <span class="px-2 py-0.5 bg-[#22C55E]/10 border border-[#22C55E]/30 text-[#22C55E] text-[10px] font-mono rounded">
          READY
        </span>
        <h1 class="text-2xl font-bold text-white m-0">{{ project.name }}</h1>
        <p class="text-sm text-[#A3A8B3] m-0">{{ project.category }} · 更新于 {{ project.updatedAt }}</p>
      </div>
      <div class="flex flex-wrap gap-2">
        <button class="px-3 h-8 bg-[#151922] border border-[#2A303C] rounded-md text-xs flex items-center gap-1.5"><Share2 class="w-3.5 h-3.5" /> 分享</button>
        <button class="px-3 h-8 bg-[#151922] border border-[#2A303C] rounded-md text-xs flex items-center gap-1.5"><Copy class="w-3.5 h-3.5" /> 复制项目</button>
        <button class="px-3 h-8 bg-[#151922] border border-[#2A303C] rounded-md text-xs flex items-center gap-1.5"><RefreshCw class="w-3.5 h-3.5" /> 重新生成</button>
        <button class="px-3 h-8 bg-[#2563EB] hover:bg-[#1D4ED8] rounded-md text-xs font-semibold flex items-center gap-1.5"><Download class="w-3.5 h-3.5" /> 下载 MP4</button>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-5 gap-6">
      <div class="lg:col-span-3 pro-card p-6 flex items-center justify-center min-h-96">
        <div v-if="previewScene" class="relative w-[220px] h-[380px] rounded-xl overflow-hidden border border-[#2A303C] shadow-2xl">
          <img :src="previewScene.imageUrl" :alt="previewScene.title" class="w-full h-full object-cover" />
          <div class="absolute bottom-6 left-3 right-3 px-3 py-1.5 bg-[#0B0D10]/85 backdrop-blur-md border border-[#2A303C] rounded-lg text-xs text-white text-center">
            {{ previewScene.voice }}
          </div>
        </div>
        <div v-else class="text-[#A3A8B3] text-sm flex items-center gap-2"><Film class="w-5 h-5" /> 暂无预览</div>
      </div>

      <div class="lg:col-span-2 space-y-4">
        <div class="pro-card p-5 space-y-3">
          <h3 class="text-[11px] font-mono font-semibold text-[#A3A8B3] uppercase m-0">视频参数</h3>
          <div v-for="item in meta" :key="item.label" class="flex justify-between text-sm">
            <span class="text-[#A3A8B3]">{{ item.label }}</span>
            <span class="text-white font-mono text-xs">{{ item.value }}</span>
          </div>
        </div>
        <button class="w-full py-2.5 bg-[#151922] hover:bg-[#1B202A] border border-[#2A303C] rounded-lg text-xs" @click="router.push({ name: 'video-plan', params: { id: projectId } })">
          返回 Studio 编辑
        </button>
      </div>
    </div>
  </div>
</template>
