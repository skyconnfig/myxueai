<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  url?: string | null
  ratio?: string
  title?: string
}>()

const isMp4 = computed(() => Boolean(props.url?.toLowerCase().includes('.mp4')))
const isHtml = computed(() => Boolean(props.url?.toLowerCase().includes('.html')))
const hasOutput = computed(() => Boolean(props.url))

const aspectClass = computed(() => {
  if (props.ratio === '16:9') return 'aspect-video w-full max-w-3xl'
  if (props.ratio === '1:1') return 'aspect-square w-full max-w-md'
  return 'aspect-[9/16] w-full max-w-[280px]'
})
</script>

<template>
  <div v-if="hasOutput" class="flex flex-col items-center gap-3 w-full">
    <div
      class="relative rounded-xl overflow-hidden border border-border shadow-2xl bg-dark"
      :class="aspectClass"
    >
      <video
        v-if="isMp4"
        :src="url!"
        class="w-full h-full object-cover bg-black"
        controls
        playsinline
        :title="title"
      />
      <iframe
        v-else-if="isHtml"
        :src="url!"
        class="w-full h-full border-0 bg-dark"
        :title="title ?? '视频预览'"
      />
      <div v-else class="w-full h-full flex items-center justify-center text-muted text-sm p-4 text-center">
        不支持的预览格式
        <a :href="url!" target="_blank" rel="noopener" class="text-accent-blue ml-1">打开文件</a>
      </div>
    </div>
    <p v-if="isHtml" class="text-[11px] text-muted m-0 text-center max-w-sm">
      当前为 HTML 预览降级（Remotion 未输出 MP4 时）。可重新生产以尝试 MP4 渲染。
    </p>
  </div>
  <div v-else class="text-muted text-sm flex flex-col items-center justify-center gap-2 min-h-64">
    <slot name="empty">暂无成片，请先完成生产流水线</slot>
  </div>
</template>
