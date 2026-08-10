<script setup lang="ts">
import { computed } from 'vue'
import { BookOpen, Mic, Music, Volume2 } from 'lucide-vue-next'
import { resolveBgmPreset } from '@xueai/shared'
import type { DemoScene } from '@/data/mockData'

const props = defineProps<{
  scenes: DemoScene[]
  selectedSceneId: string
  isPlaying: boolean
  totalDuration?: number
  bgmCategory?: string | null
}>()

const emit = defineEmits<{
  selectScene: [id: string]
}>()

const waveformHeights = [40, 70, 30, 90, 60, 100, 40, 80, 50, 90, 30, 70, 100, 60, 40]

const timelineTotal = computed(() =>
  props.totalDuration ?? props.scenes.reduce((sum, s) => sum + s.duration, 0),
)

const bgmLabel = computed(() => {
  const preset = resolveBgmPreset(props.bgmCategory)
  return `${preset.label} · ${preset.mood.split(',')[0]}`
})

const PURPOSE_STYLES: Record<string, { label: string; chip: string }> = {
  hook: { label: 'Hook', chip: 'bg-purple-500/20 text-purple-300 border-purple-500/30' },
  problem: { label: 'Problem', chip: 'bg-red-500/20 text-red-300 border-red-500/30' },
  solution: { label: 'Solution', chip: 'bg-sky-500/20 text-sky-300 border-sky-500/30' },
  demo: { label: 'Demo', chip: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' },
  result: { label: 'Result', chip: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
  cta: { label: 'CTA', chip: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
}

const COMPONENT_LABELS: Record<string, string> = {
  CinematicFallback: '电影镜头',
  broll_video: 'B-Roll',
  cinematic_still: '静帧',
  ProductDemo: '产品演示',
  BrowserWindow: '浏览器',
  DashboardAnimation: '数据看板',
  FeatureReveal: '功能揭示',
  BeforeAfter: '前后对比',
  CTA: '行动号召',
}

const TRANSITION_LABELS: Record<string, string> = {
  cut: '硬切',
  fade: '淡入淡出',
  crossfade: '叠化',
  push: '推镜',
}

function purposeStyle(scene: DemoScene) {
  const key = (scene.purpose ?? scene.storyBeat ?? '').toLowerCase()
  return PURPOSE_STYLES[key] ?? { label: key || 'Scene', chip: 'bg-white/5 text-muted border-border' }
}

function componentLabel(scene: DemoScene) {
  const raw = scene.componentType ?? 'CinematicFallback'
  return COMPONENT_LABELS[raw] ?? raw
}

function sceneWidthPercent(scene: DemoScene) {
  const total = timelineTotal.value || 1
  return Math.max(12, Math.round((scene.duration / total) * 100))
}

function transitionLabel(scene: DemoScene) {
  return TRANSITION_LABELS[scene.transition] ?? scene.transition
}
</script>

<template>
  <div class="h-56 glass-panel mx-4 mb-4 p-4 flex flex-col shrink-0 border-t border-border/60">
    <div class="flex items-center justify-between mb-3 shrink-0">
      <div class="flex items-center gap-2">
        <BookOpen class="w-4 h-4 text-accent-blue" />
        <span class="text-sm font-semibold text-white">剧情时间线</span>
        <span class="text-[10px] text-muted font-mono">Story Timeline</span>
      </div>
      <div class="flex items-center gap-3 text-[10px] font-mono text-muted">
        <span>{{ scenes.length }} 个章节</span>
        <span class="text-white/70">{{ timelineTotal }}s 总时长</span>
      </div>
    </div>

    <div v-if="!scenes.length" class="flex-1 flex items-center justify-center text-xs text-muted border border-dashed border-border rounded-xl">
      AI 创建完成后，故事章节将在此展示
    </div>

    <div v-else class="flex-1 flex gap-2 overflow-x-auto pb-1 items-stretch min-h-0">
      <template v-for="(scene, idx) in scenes" :key="scene.id">
        <button
          type="button"
          class="ui-card flex-shrink-0 flex flex-col !cursor-pointer overflow-hidden min-w-[148px]"
          :class="scene.id === selectedSceneId ? 'ui-card--active ring-1 ring-accent-blue/50' : ''"
          :style="{ flex: `0 0 ${sceneWidthPercent(scene)}%`, maxWidth: '220px' }"
          @click="emit('selectScene', scene.id)"
        >
          <div class="relative h-14 -mx-3 -mt-3 mb-2 overflow-hidden bg-dark/80">
            <img
              v-if="scene.imageUrl"
              :src="scene.imageUrl"
              alt=""
              class="w-full h-full object-cover opacity-80"
            />
            <div class="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />
            <div class="absolute top-1.5 left-2 flex items-center gap-1">
              <span
                class="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border"
                :class="purposeStyle(scene).chip"
              >
                {{ purposeStyle(scene).label }}
              </span>
              <span
                v-if="scene.audioUrl"
                class="w-4 h-4 rounded-full bg-success/20 flex items-center justify-center"
                title="配音已就绪"
              >
                <Volume2 class="w-2.5 h-2.5 text-success" />
              </span>
              <span
                v-else-if="scene.voice"
                class="w-4 h-4 rounded-full bg-warning/15 flex items-center justify-center"
                title="待生成配音"
              >
                <Mic class="w-2.5 h-2.5 text-warning" />
              </span>
            </div>
          </div>

          <div class="ui-card__label mb-1 flex items-center justify-between gap-1">
            <span>{{ String(idx + 1).padStart(2, '0') }} · {{ scene.duration }}s</span>
            <span class="text-[9px] text-accent-blue/80 truncate">{{ componentLabel(scene) }}</span>
          </div>
          <div class="ui-card__title truncate mb-0.5">{{ scene.title }}</div>
          <div class="ui-card__desc line-clamp-2 flex-1 text-[10px] leading-snug">{{ scene.voice }}</div>

          <div class="mt-2 flex items-center gap-2">
            <div class="flex-1 h-1 rounded-full bg-border overflow-hidden">
              <div
                class="h-full rounded-full bg-gradient-to-r from-accent-blue/40 to-accent-blue"
                :style="{ width: `${sceneWidthPercent(scene)}%` }"
              />
            </div>
          </div>
        </button>

        <div
          v-if="idx < scenes.length - 1"
          class="flex flex-col items-center justify-center shrink-0 w-6 text-[8px] text-muted font-mono"
          :title="transitionLabel(scene)"
        >
          <div class="w-px h-6 bg-border mb-0.5" />
          <span class="truncate max-w-full">{{ transitionLabel(scene) }}</span>
        </div>
      </template>
    </div>

    <div class="mt-3 flex items-center gap-2 shrink-0">
      <Music class="w-3.5 h-3.5 text-warning shrink-0" />
      <div class="flex-1 flex items-center justify-between px-3 py-1.5 bg-dark/50 border border-border rounded-lg">
        <span class="text-[10px] text-warning font-mono">BGM · {{ bgmLabel }}</span>
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
