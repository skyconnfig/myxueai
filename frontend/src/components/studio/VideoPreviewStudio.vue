<script setup lang="ts">
import { computed } from 'vue'
import {
  Mic,
  Pause,
  Palette,
  Play,
  RotateCcw,
  Scissors,
  Sparkles,
  Subtitles,
  Type,
  Volume2,
  VolumeX,
  Wand2,
} from 'lucide-vue-next'
import type { DemoScene } from '@/data/mockData'
import type { VideoRatio } from '@/types'

const props = defineProps<{
  scene?: DemoScene
  ratio: VideoRatio
  currentTime: number
  totalDuration: number
  isPlaying: boolean
  showSubtitles: boolean
  isMuted: boolean
  projectName: string
  style: string
  progress: number
  hasScenes: boolean
}>()

const emit = defineEmits<{
  'update:currentTime': [value: number]
  'update:isPlaying': [value: boolean]
  'update:showSubtitles': [value: boolean]
  'update:isMuted': [value: boolean]
  aiOptimize: []
  changeStyle: []
  redub: []
  autoEdit: []
  editSubtitles: []
}>()

const previewSizeClass = computed(() => {
  if (props.ratio === '16:9') return 'w-[520px] h-[290px]'
  if (props.ratio === '1:1') return 'w-[320px] h-[320px]'
  return 'w-[220px] h-[380px]'
})

const aiActions = [
  { key: 'optimize', label: 'AI 优化', icon: Sparkles, emit: 'aiOptimize' as const },
  { key: 'style', label: '改变风格', icon: Palette, emit: 'changeStyle' as const },
  { key: 'voice', label: '重新配音', icon: Mic, emit: 'redub' as const },
  { key: 'edit', label: '自动剪辑', icon: Scissors, emit: 'autoEdit' as const },
  { key: 'sub', label: '修改字幕', icon: Subtitles, emit: 'editSubtitles' as const },
]
</script>

<template>
  <div class="flex flex-col h-full p-4 gap-4 overflow-hidden">
    <div class="glass-panel px-4 py-3 flex items-center justify-between shrink-0">
      <div>
        <div class="text-sm font-semibold text-white flex items-center gap-2">
          <Wand2 class="w-4 h-4 text-accent-blue" />
          AI 生成预览
        </div>
        <p class="text-[11px] text-muted m-0 mt-0.5 truncate max-w-[280px]">{{ projectName }}</p>
      </div>
      <div class="flex items-center gap-4 text-[11px] font-mono">
        <div class="text-center">
          <div class="text-muted">时长</div>
          <div class="text-white font-semibold">{{ totalDuration }}s</div>
        </div>
        <div class="text-center">
          <div class="text-muted">比例</div>
          <div class="text-white font-semibold">{{ ratio }}</div>
        </div>
        <div class="text-center">
          <div class="text-muted">风格</div>
          <div class="text-white font-semibold max-w-[80px] truncate">{{ style }}</div>
        </div>
        <div class="text-center">
          <div class="text-muted">进度</div>
          <div class="text-accent-blue font-semibold">{{ progress }}%</div>
        </div>
      </div>
    </div>

    <div class="flex-1 flex flex-col items-center justify-center min-h-0">
      <div
        v-if="scene && hasScenes"
        class="relative rounded-2xl overflow-hidden shadow-glow-purple border border-border/80 flex items-center justify-center max-h-[380px] bg-black"
        :class="previewSizeClass"
      >
        <img :src="scene.imageUrl" :alt="scene.title" class="w-full h-full object-cover" />
        <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 pointer-events-none" />
        <div class="absolute top-3 left-3 px-2 py-0.5 glass-panel text-[10px] font-mono text-accent-blue rounded-lg">
          {{ scene.cameraAngle }}
        </div>
        <div class="absolute top-3 right-3 px-2 py-0.5 glass-panel text-[10px] font-mono text-white rounded-lg">
          {{ currentTime.toFixed(1) }}s / {{ totalDuration }}s
        </div>
        <div
          v-if="showSubtitles"
          class="absolute bottom-6 left-4 right-4 text-center px-3 py-2 glass-panel rounded-xl"
        >
          <span class="text-xs font-semibold text-white tracking-wide">{{ scene.voice }}</span>
        </div>
      </div>
      <div v-else class="glass-panel rounded-2xl p-12 text-center max-w-md">
        <Sparkles class="w-10 h-10 text-accent-purple mx-auto mb-3 opacity-80" />
        <p class="text-sm text-white font-medium m-0 mb-1">等待 AI 创建</p>
        <p class="text-xs text-muted m-0">完成左侧「AI 创建视频」后，预览将在此呈现</p>
      </div>

      <div class="mt-4 flex flex-wrap items-center justify-center gap-2">
        <button
          v-for="action in aiActions"
          :key="action.key"
          type="button"
          class="btn-soft !h-8 !px-3 !rounded-lg !text-[11px]"
          @click="emit(action.emit)"
        >
          <component :is="action.icon" class="w-3.5 h-3.5 text-accent-blue" />
          {{ action.label }}
        </button>
      </div>

      <div class="mt-4 flex items-center gap-2 btn-soft !h-auto !px-3 !py-2 !rounded-xl">
        <button type="button" class="btn-nav !w-auto !p-1.5" @click="emit('update:currentTime', 0)">
          <RotateCcw class="w-4 h-4" />
        </button>
        <button
          type="button"
          class="btn-soft btn-soft--primary !w-9 !h-9 !p-0 !rounded-lg"
          @click="emit('update:isPlaying', !isPlaying)"
        >
          <Pause v-if="isPlaying" class="w-4 h-4 text-accent-blue fill-current" />
          <Play v-else class="w-4 h-4 text-accent-blue fill-current ml-0.5" />
        </button>
        <input
          :value="currentTime"
          type="range"
          :min="0"
          :max="totalDuration || 1"
          step="0.1"
          class="w-48 accent-accent-blue cursor-pointer"
          @input="emit('update:currentTime', Number(($event.target as HTMLInputElement).value))"
        />
        <span class="font-mono text-[11px] text-muted">
          00:{{ Math.floor(currentTime).toString().padStart(2, '0') }}
        </span>
        <div class="h-4 w-px bg-border" />
        <button
          type="button"
          class="btn-nav !w-auto !p-1.5"
          :class="showSubtitles ? 'btn-nav--active' : ''"
          @click="emit('update:showSubtitles', !showSubtitles)"
        >
          <Type class="w-4 h-4" :class="showSubtitles ? 'text-accent-blue' : ''" />
        </button>
        <button
          type="button"
          class="btn-nav !w-auto !p-1.5"
          :class="isMuted ? 'btn-nav--active' : ''"
          @click="emit('update:isMuted', !isMuted)"
        >
          <VolumeX v-if="isMuted" class="w-4 h-4" />
          <Volume2 v-else class="w-4 h-4" />
        </button>
      </div>
    </div>
  </div>
</template>
