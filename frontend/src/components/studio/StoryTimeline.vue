<script setup lang="ts">
import { BookOpen, Music } from 'lucide-vue-next'
import type { DemoScene } from '@/data/mockData'

defineProps<{
  scenes: DemoScene[]
  selectedSceneId: string
  isPlaying: boolean
}>()

const emit = defineEmits<{
  selectScene: [id: string]
}>()

const waveformHeights = [40, 70, 30, 90, 60, 100, 40, 80, 50, 90, 30, 70, 100, 60, 40]
</script>

<template>
  <div class="h-52 glass-panel mx-4 mb-4 p-4 flex flex-col shrink-0 border-t border-border/60">
    <div class="flex items-center justify-between mb-3 shrink-0">
      <div class="flex items-center gap-2">
        <BookOpen class="w-4 h-4 text-accent-blue" />
        <span class="text-sm font-semibold text-white">剧情时间线</span>
        <span class="text-[10px] text-muted font-mono">Story Timeline</span>
      </div>
      <span class="text-[10px] text-muted font-mono">{{ scenes.length }} 个章节</span>
    </div>

    <div v-if="!scenes.length" class="flex-1 flex items-center justify-center text-xs text-muted border border-dashed border-border rounded-xl">
      AI 创建完成后，故事章节将在此展示
    </div>

    <div v-else class="flex-1 flex gap-3 overflow-x-auto pb-1 items-stretch">
      <button
        v-for="(scene, idx) in scenes"
        :key="scene.id"
        class="min-w-[140px] max-w-[180px] flex-shrink-0 text-left p-3 rounded-xl border transition-all flex flex-col"
        :class="
          scene.id === selectedSceneId
            ? 'btn-nav--active border border-border'
            : 'bg-card border border-border hover:border-accent-blue/40'
        "
        @click="emit('selectScene', scene.id)"
      >
        <div class="text-[10px] font-mono text-accent-blue font-bold mb-1">
          {{ String(idx + 1).padStart(2, '0') }} · {{ scene.duration }}s
        </div>
        <div class="text-xs font-semibold text-white truncate mb-1">{{ scene.title }}</div>
        <div class="text-[10px] text-muted line-clamp-2 leading-relaxed flex-1">{{ scene.voice }}</div>
        <div class="mt-2 h-0.5 rounded-full bg-border overflow-hidden">
          <div class="h-full bg-accent-blue/60" :style="{ width: `${Math.min(scene.duration * 8, 100)}%` }" />
        </div>
      </button>
    </div>

    <div class="mt-3 flex items-center gap-2 shrink-0">
      <Music class="w-3.5 h-3.5 text-warning shrink-0" />
      <div class="flex-1 flex items-center justify-between px-3 py-1.5 bg-dark/50 border border-border rounded-lg">
        <span class="text-[10px] text-warning font-mono">BGM · 科技脉冲 Synth 120BPM</span>
        <div class="flex items-center gap-0.5">
          <div
            v-for="(h, i) in waveformHeights.slice(0, 12)"
            :key="i"
            class="w-1 rounded-full bg-warning/80"
            :class="isPlaying ? 'animate-wave' : ''"
            :style="{ height: `${h * 0.14}px` }"
          />
        </div>
      </div>
    </div>
  </div>
</template>
