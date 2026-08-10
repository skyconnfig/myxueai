<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from 'vue'
import {
  Maximize2,
  Mic,
  Minimize2,
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
  X,
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
  isOptimizing?: boolean
  sceneStartTime?: number
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

const previewSizeClass = computed(() => previewFrameClass(false))

function previewFrameClass(fullscreen: boolean) {
  if (fullscreen) {
    if (props.ratio === '16:9') return 'w-full max-w-[min(92vw,calc(78vh*16/9))] aspect-video max-h-[78vh]'
    if (props.ratio === '1:1') return 'w-[min(78vh,92vw)] h-[min(78vh,92vw)] max-w-full max-h-[78vh]'
    return 'h-[78vh] w-auto aspect-[9/16] max-w-[92vw]'
  }
  if (props.ratio === '16:9') return 'w-[520px] h-[290px]'
  if (props.ratio === '1:1') return 'w-[320px] h-[320px]'
  return 'w-[220px] h-[380px]'
}

const isFullscreen = ref(false)

function openFullscreen() {
  if (!props.scene || !props.hasScenes) return
  isFullscreen.value = true
  document.body.style.overflow = 'hidden'
}

function closeFullscreen() {
  isFullscreen.value = false
  document.body.style.overflow = ''
}

function onFullscreenKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') closeFullscreen()
}

watch(isFullscreen, (open) => {
  if (open) window.addEventListener('keydown', onFullscreenKeydown)
  else window.removeEventListener('keydown', onFullscreenKeydown)
})

onUnmounted(() => {
  document.body.style.overflow = ''
  window.removeEventListener('keydown', onFullscreenKeydown)
})

const aiActions = [
  { key: 'optimize', label: 'AI 优化', icon: Sparkles, emit: 'aiOptimize' as const },
  { key: 'style', label: '改变风格', icon: Palette, emit: 'changeStyle' as const },
  { key: 'voice', label: '重新配音', icon: Mic, emit: 'redub' as const },
  { key: 'edit', label: '自动剪辑', icon: Scissors, emit: 'autoEdit' as const },
  { key: 'sub', label: '修改字幕', icon: Subtitles, emit: 'editSubtitles' as const },
]

const audioEl = ref<HTMLAudioElement | null>(null)
const hasAudio = computed(() => Boolean(props.scene?.audioUrl))
const loadedAudioUrl = ref<string | null>(null)

function localSceneTime() {
  return Math.max(0, props.currentTime - (props.sceneStartTime ?? 0))
}

async function ensureAudioReady() {
  const el = audioEl.value
  const url = props.scene?.audioUrl
  if (!el || !url) return false

  if (loadedAudioUrl.value !== url) {
    el.src = url
    loadedAudioUrl.value = url
    el.load()
    await new Promise<void>((resolve) => {
      if (el.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
        resolve()
        return
      }
      const onReady = () => {
        el.removeEventListener('canplay', onReady)
        resolve()
      }
      el.addEventListener('canplay', onReady, { once: true })
    })
  }

  const localTime = localSceneTime()
  if (localTime <= props.scene!.duration && Math.abs(el.currentTime - localTime) > 0.2) {
    el.currentTime = localTime
  }
  return localTime <= props.scene!.duration
}

async function playAudioFromUserGesture() {
  if (props.isMuted || !props.scene?.audioUrl) return
  const ok = await ensureAudioReady()
  const el = audioEl.value
  if (!ok || !el) return
  try {
    await el.play()
  } catch {
    /* browser blocked */
  }
}

function pauseAudio() {
  audioEl.value?.pause()
}

async function syncPlayback() {
  const el = audioEl.value
  if (!el || !props.scene?.audioUrl || props.isMuted) {
    pauseAudio()
    return
  }

  const localTime = localSceneTime()
  if (localTime > props.scene.duration) {
    pauseAudio()
    return
  }

  await ensureAudioReady()

  if (props.isPlaying) {
    try {
      await el.play()
    } catch {
      /* autoplay policy */
    }
  } else {
    pauseAudio()
  }
}

function togglePlay() {
  const next = !props.isPlaying
  emit('update:isPlaying', next)
  if (next) {
    void playAudioFromUserGesture()
  } else {
    pauseAudio()
  }
}

watch(
  () => [props.isPlaying, props.currentTime, props.scene?.audioUrl, props.isMuted, props.sceneStartTime] as const,
  () => {
    void syncPlayback()
  },
  { flush: 'post' },
)

watch(
  () => props.scene?.audioUrl,
  (url) => {
    if (!url) {
      loadedAudioUrl.value = null
      pauseAudio()
    }
  },
)
</script>

<template>
  <div class="flex flex-col h-full p-4 gap-4 overflow-hidden">
    <div class="glass-panel px-4 py-3 flex items-center justify-between shrink-0">
      <div>
        <div class="text-sm font-semibold text-white flex items-center gap-2">
          <Wand2 class="w-4 h-4 text-accent-blue" />
          AI 生成预览
        </div>
        <p class="ui-meta-line m-0 mt-0.5 truncate max-w-[280px]">{{ projectName }}</p>
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
      <audio
        ref="audioEl"
        preload="auto"
        class="hidden"
      />
      <div
        v-if="scene && hasScenes"
        class="relative rounded-2xl overflow-hidden shadow-glow-purple border border-border/80 flex items-center justify-center max-h-[380px] bg-black group cursor-pointer"
        :class="previewSizeClass"
        @dblclick="openFullscreen"
      >
        <img
          v-if="scene.imageUrl"
          :src="scene.imageUrl"
          :alt="scene.title"
          class="w-full h-full object-cover"
        />
        <div
          v-else
          class="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950"
        >
          <Sparkles class="w-8 h-8 text-accent-blue mb-3 opacity-80" />
          <p class="text-xs text-accent-blue font-mono m-0 mb-2">正在生成匹配画面...</p>
          <p class="text-sm text-white/90 m-0 leading-relaxed line-clamp-4">{{ scene.visual || scene.voice }}</p>
        </div>
        <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 pointer-events-none" />
        <button
          type="button"
          class="absolute top-3 right-3 p-1.5 rounded-lg bg-black/50 text-white/80 hover:text-white hover:bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity z-10"
          title="全屏预览"
          @click.stop="openFullscreen"
        >
          <Maximize2 class="w-4 h-4" />
        </button>
        <div class="absolute top-3 left-3 px-2 py-0.5 glass-panel text-[10px] font-mono text-accent-blue rounded-lg">
          {{ scene.cameraAngle }}
        </div>
        <div class="absolute top-12 right-3 flex flex-col items-end gap-1">
          <span class="px-2 py-0.5 glass-panel text-[10px] font-mono text-white rounded-lg">
            {{ currentTime.toFixed(1) }}s / {{ totalDuration }}s
          </span>
          <span
            v-if="hasAudio"
            class="px-2 py-0.5 glass-panel text-[10px] font-mono rounded-lg"
            :class="isMuted ? 'text-muted' : 'text-success'"
          >
            {{ isMuted ? '配音已静音' : '配音已就绪' }}
          </span>
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
          :disabled="action.key === 'optimize' && isOptimizing"
          @click="emit(action.emit)"
        >
          <component
            :is="action.icon"
            class="w-3.5 h-3.5 text-accent-blue"
            :class="action.key === 'optimize' && isOptimizing ? 'animate-pulse' : ''"
          />
          {{ action.key === 'optimize' && isOptimizing ? '优化中...' : action.label }}
        </button>
      </div>

      <div class="mt-4 flex items-center gap-2 btn-soft !h-auto !px-3 !py-2 !rounded-xl">
        <button type="button" class="btn-nav !w-auto !p-1.5" @click="emit('update:currentTime', 0)">
          <RotateCcw class="w-4 h-4" />
        </button>
        <button
          type="button"
          class="btn-soft btn-soft--primary !w-9 !h-9 !p-0 !rounded-lg"
          @click="togglePlay"
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
        <button
          type="button"
          class="btn-nav !w-auto !p-1.5"
          :disabled="!scene || !hasScenes"
          title="全屏预览"
          @click="openFullscreen"
        >
          <Maximize2 class="w-4 h-4" />
        </button>
      </div>
    </div>

    <Teleport to="body">
      <div
        v-if="isFullscreen && scene && hasScenes"
        class="fixed inset-0 z-[2000] bg-black/95 backdrop-blur-sm flex flex-col"
      >
        <div class="flex items-center justify-between px-5 py-3 border-b border-white/10 shrink-0">
          <div class="min-w-0">
            <div class="text-sm font-semibold text-white truncate">{{ projectName }}</div>
            <div class="text-[11px] text-muted font-mono mt-0.5">
              {{ ratio }} · {{ totalDuration }}s · {{ style }}
            </div>
          </div>
          <button
            type="button"
            class="btn-nav !w-auto !px-3 !py-2 flex items-center gap-2"
            @click="closeFullscreen"
          >
            <Minimize2 class="w-4 h-4" />
            退出全屏
          </button>
        </div>

        <div class="flex-1 flex flex-col items-center justify-center min-h-0 px-4 py-6 gap-6">
          <div
            class="relative rounded-2xl overflow-hidden border border-white/15 shadow-2xl bg-black flex items-center justify-center"
            :class="previewFrameClass(true)"
          >
            <img
              v-if="scene.imageUrl"
              :src="scene.imageUrl"
              :alt="scene.title"
              class="w-full h-full object-cover"
            />
            <div
              v-else
              class="w-full h-full flex flex-col items-center justify-center p-8 text-center bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950"
            >
              <Sparkles class="w-10 h-10 text-accent-blue mb-4 opacity-80" />
              <p class="text-sm text-accent-blue font-mono m-0 mb-3">正在生成匹配画面...</p>
              <p class="text-base text-white/90 m-0 leading-relaxed max-w-md">{{ scene.visual || scene.voice }}</p>
            </div>
            <div class="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/25 pointer-events-none" />
            <div class="absolute top-4 left-4 px-2.5 py-1 glass-panel text-xs font-mono text-accent-blue rounded-lg">
              {{ scene.cameraAngle }}
            </div>
            <div class="absolute top-4 right-4 flex flex-col items-end gap-1.5">
              <span class="px-2.5 py-1 glass-panel text-xs font-mono text-white rounded-lg">
                {{ currentTime.toFixed(1) }}s / {{ totalDuration }}s
              </span>
              <span
                v-if="hasAudio"
                class="px-2.5 py-1 glass-panel text-xs font-mono rounded-lg"
                :class="isMuted ? 'text-muted' : 'text-success'"
              >
                {{ isMuted ? '配音已静音' : '配音已就绪' }}
              </span>
            </div>
            <div
              v-if="showSubtitles"
              class="absolute bottom-8 left-6 right-6 text-center px-4 py-3 glass-panel rounded-xl"
            >
              <span class="text-base sm:text-lg font-semibold text-white tracking-wide leading-relaxed">
                {{ scene.voice }}
              </span>
            </div>
          </div>

          <div class="flex items-center gap-3 btn-soft !h-auto !px-4 !py-3 !rounded-xl w-full max-w-2xl">
            <button type="button" class="btn-nav !w-auto !p-2" @click="emit('update:currentTime', 0)">
              <RotateCcw class="w-5 h-5" />
            </button>
            <button
              type="button"
              class="btn-soft btn-soft--primary !w-11 !h-11 !p-0 !rounded-xl"
              @click="togglePlay"
            >
              <Pause v-if="isPlaying" class="w-5 h-5 text-accent-blue fill-current" />
              <Play v-else class="w-5 h-5 text-accent-blue fill-current ml-0.5" />
            </button>
            <input
              :value="currentTime"
              type="range"
              :min="0"
              :max="totalDuration || 1"
              step="0.1"
              class="flex-1 accent-accent-blue cursor-pointer min-w-0"
              @input="emit('update:currentTime', Number(($event.target as HTMLInputElement).value))"
            />
            <span class="font-mono text-sm text-muted shrink-0">
              00:{{ Math.floor(currentTime).toString().padStart(2, '0') }}
            </span>
            <button
              type="button"
              class="btn-nav !w-auto !p-2"
              :class="showSubtitles ? 'btn-nav--active' : ''"
              @click="emit('update:showSubtitles', !showSubtitles)"
            >
              <Type class="w-5 h-5" :class="showSubtitles ? 'text-accent-blue' : ''" />
            </button>
            <button
              type="button"
              class="btn-nav !w-auto !p-2"
              :class="isMuted ? 'btn-nav--active' : ''"
              @click="emit('update:isMuted', !isMuted)"
            >
              <VolumeX v-if="isMuted" class="w-5 h-5" />
              <Volume2 v-else class="w-5 h-5" />
            </button>
            <button type="button" class="btn-nav !w-auto !p-2" title="退出全屏" @click="closeFullscreen">
              <X class="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
