<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  scenes: Array<{ order: number; title: string; duration: number; voiceText?: string }>
  totalDuration?: number
}>()

const total = computed(() => props.totalDuration ?? props.scenes.reduce((sum, s) => sum + s.duration, 0))

const waveformHeights = [
  35, 55, 40, 70, 45, 60, 30, 80, 50, 65, 42, 75, 38, 58, 48, 72,
  33, 68, 44, 62, 52, 78, 36, 55, 46, 63, 41, 69, 37, 57, 49, 71,
  34, 66, 43, 61, 51, 77, 39, 59, 47, 64, 45, 73, 32, 56, 50, 67,
]

function blockWidth(duration: number) {
  return `${Math.max((duration / total.value) * 100, 8)}%`
}
</script>

<template>
  <div class="xf-panel overflow-hidden">
    <div class="xf-panel-header flex items-center justify-between">
      <span>Multi-Track Timeline</span>
      <span class="font-mono normal-case tracking-normal text-gray-600">00:00 — {{ total }}s</span>
    </div>

    <div class="p-4 space-y-3">
      <div class="flex items-center gap-2 text-[10px] text-gray-600 font-mono px-1">
        <span class="w-16 shrink-0" />
        <span v-for="t in 7" :key="t" class="flex-1">{{ String((t - 1) * 10).padStart(2, '0') }}:00</span>
      </div>

      <div class="space-y-2">
        <div class="flex items-center gap-2">
          <span class="w-16 shrink-0 text-[10px] text-gray-500 uppercase">Video</span>
          <div class="flex-1 flex gap-1 h-8">
            <div
              v-for="scene in scenes"
              :key="scene.order"
              class="h-full rounded-md bg-gradient-to-r from-blue-600/80 to-blue-500/60 border border-blue-400/20 flex items-center px-2 text-[10px] text-white/80 truncate"
              :style="{ width: blockWidth(scene.duration) }"
            >
              S{{ scene.order }}
            </div>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <span class="w-16 shrink-0 text-[10px] text-gray-500 uppercase">Subs</span>
          <div class="flex-1 flex gap-1 h-6">
            <div
              v-for="scene in scenes"
              :key="`sub-${scene.order}`"
              class="h-full rounded bg-emerald-500/20 border border-emerald-500/20 flex items-center px-2 text-[9px] text-emerald-300/80 truncate"
              :style="{ width: blockWidth(scene.duration) }"
            >
              {{ scene.voiceText?.slice(0, 12) }}...
            </div>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <span class="w-16 shrink-0 text-[10px] text-gray-500 uppercase">Audio</span>
          <div class="flex-1 h-6 rounded bg-orange-500/10 border border-orange-500/20 flex items-center px-3">
            <div class="flex-1 flex items-end gap-px h-3">
              <div
                v-for="(h, i) in waveformHeights"
                :key="i"
                class="flex-1 bg-orange-400/50 rounded-sm"
                :style="{ height: `${h}%` }"
              />
            </div>
            <span class="ml-3 text-[9px] text-orange-300/70 shrink-0">BGM: Synth Beat</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
