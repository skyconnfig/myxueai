<script setup lang="ts">
import { NTag } from 'naive-ui'
import { Clock, Film } from 'lucide-vue-next'
import type { Project } from '@/types'

defineProps<{
  project: Project
}>()

defineEmits<{
  click: []
}>()

const statusMap: Record<string, { type: 'default' | 'info' | 'success' | 'warning' | 'error'; label: string }> = {
  DRAFT: { type: 'default', label: '草稿' },
  PLANNING: { type: 'info', label: '规划中' },
  GENERATING: { type: 'warning', label: '生成中' },
  RENDERING: { type: 'warning', label: '渲染中' },
  COMPLETED: { type: 'success', label: '已完成' },
  FAILED: { type: 'error', label: '失败' },
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('zh-CN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
</script>

<template>
  <div
    class="group xf-panel overflow-hidden cursor-pointer transition-all hover:border-white/15 hover:shadow-lg hover:shadow-black/20"
    @click="$emit('click')"
  >
    <div
      class="aspect-video relative overflow-hidden bg-gradient-to-br from-slate-800 via-slate-900 to-blue-950"
    >
      <div class="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.35),transparent_55%)]" />
      <div class="absolute bottom-3 left-3 right-3">
        <NTag size="small" :bordered="false" class="bg-black/40! backdrop-blur-sm">
          {{ project.ratio }}
        </NTag>
      </div>
      <div class="absolute top-3 right-3">
        <NTag
          size="small"
          :type="statusMap[project.status]?.type ?? 'default'"
          :bordered="false"
        >
          {{ statusMap[project.status]?.label ?? project.status }}
        </NTag>
      </div>
    </div>

    <div class="p-4 space-y-2">
      <div class="flex items-start gap-2">
        <Film :size="14" class="text-blue-400 mt-0.5 shrink-0" />
        <h3 class="text-sm font-medium text-white line-clamp-2 leading-snug">
          {{ project.name || project.prompt }}
        </h3>
      </div>
      <div class="flex items-center gap-1.5 text-xs text-gray-500">
        <Clock :size="12" />
        <span>{{ formatDate(project.createdAt) }}</span>
        <span class="mx-1">·</span>
        <span>{{ project.duration }}s</span>
      </div>
    </div>
  </div>
</template>
