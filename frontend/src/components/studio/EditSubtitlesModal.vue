<script setup lang="ts">
import { ref, watch } from 'vue'
import { Subtitles, X } from 'lucide-vue-next'
import type { DemoScene } from '@/data/mockData'

const props = defineProps<{
  show: boolean
  scene?: DemoScene
  loading?: boolean
}>()

const emit = defineEmits<{
  close: []
  save: [payload: { voiceText: string; color: string; fontSize: number }]
}>()

const voiceText = ref('')
const color = ref('#ffffff')
const fontSize = ref(38)

watch(
  () => [props.show, props.scene] as const,
  ([open, scene]) => {
    if (!open || !scene) return
    voiceText.value = scene.voice ?? scene.description ?? ''
    color.value = scene.cues?.captionStyle?.color ?? '#ffffff'
    fontSize.value = scene.cues?.captionStyle?.fontSize ?? 38
  },
  { immediate: true },
)

function handleSave() {
  if (!voiceText.value.trim()) return
  emit('save', {
    voiceText: voiceText.value.trim(),
    color: color.value,
    fontSize: fontSize.value,
  })
}
</script>

<template>
  <div
    v-if="show"
    class="fixed inset-0 bg-dark/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    @click.self="emit('close')"
  >
    <div class="glass-panel max-w-lg w-full p-5 space-y-4 shadow-glow-blue">
      <div class="flex items-start justify-between gap-3 border-b border-border pb-3">
        <div>
          <h3 class="text-base font-semibold text-white m-0 flex items-center gap-2">
            <Subtitles class="w-4 h-4 text-accent-blue" />
            修改字幕
          </h3>
          <p class="text-xs text-muted m-0 mt-1">
            分镜 {{ scene?.index ?? '-' }} · 修改口播文案与字幕样式
          </p>
        </div>
        <button type="button" class="text-muted hover:text-white p-1" :disabled="loading" @click="emit('close')">
          <X class="w-4 h-4" />
        </button>
      </div>

      <div class="space-y-1.5">
        <label class="text-[11px] text-muted font-mono">字幕文案</label>
        <textarea
          v-model="voiceText"
          rows="4"
          class="w-full bg-dark/60 border border-border rounded-xl px-3 py-2.5 text-sm text-white resize-none focus:outline-none focus:border-accent-blue"
          placeholder="输入口播 / 字幕文字..."
        />
        <p class="text-[10px] text-muted m-0">{{ voiceText.length }} 字 · 修改后需重新配音才同步音频</p>
      </div>

      <div class="grid grid-cols-2 gap-3">
        <div class="space-y-1.5">
          <label class="text-[11px] text-muted font-mono">字幕颜色</label>
          <div class="flex items-center gap-2">
            <input v-model="color" type="color" class="w-10 h-9 rounded-lg border border-border bg-transparent cursor-pointer" />
            <input
              v-model="color"
              class="flex-1 bg-dark/60 border border-border rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none"
            />
          </div>
        </div>
        <div class="space-y-1.5">
          <label class="text-[11px] text-muted font-mono">字号 {{ fontSize }}px</label>
          <input
            v-model.number="fontSize"
            type="range"
            min="24"
            max="56"
            class="w-full accent-accent-blue"
          />
        </div>
      </div>

      <div
        class="rounded-xl p-4 text-center border border-border/60"
        :style="{ color, fontSize: `${fontSize}px`, fontWeight: 700, textShadow: '0 4px 24px rgba(0,0,0,0.8)' }"
      >
        {{ voiceText || '字幕预览' }}
      </div>

      <button
        type="button"
        class="btn-ai-gradient w-full !h-10 !text-sm font-semibold disabled:opacity-50"
        :disabled="loading || !voiceText.trim()"
        @click="handleSave"
      >
        {{ loading ? '保存中...' : '保存字幕' }}
      </button>
    </div>
  </div>
</template>
