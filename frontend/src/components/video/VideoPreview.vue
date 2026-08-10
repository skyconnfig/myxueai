<script setup lang="ts">
import { ref } from 'vue'
import { Maximize2, Pause, Play, Volume2 } from 'lucide-vue-next'

defineProps<{
  ratio?: string
  caption?: string
  posterGradient?: string
}>()

const playing = ref(false)
</script>

<template>
  <div class="flex flex-col items-center gap-4 h-full">
    <div
      class="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl shadow-black/40 bg-black"
      :class="ratio === '16:9' ? 'w-full max-w-2xl aspect-video' : ratio === '1:1' ? 'w-72 aspect-square' : 'w-56 aspect-[9/16]'"
    >
      <div
        class="absolute inset-0 bg-gradient-to-br from-violet-900/80 via-slate-900 to-blue-900"
        :style="posterGradient ? { background: posterGradient } : undefined"
      />
      <div class="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(255,255,255,0.08),transparent_60%)]" />

      <div v-if="caption" class="absolute bottom-16 left-4 right-4">
        <div class="px-3 py-2 rounded-lg bg-black/55 backdrop-blur-sm border border-white/10 text-sm text-white text-center leading-snug">
          {{ caption }}
        </div>
      </div>

      <button
        class="absolute inset-0 flex items-center justify-center group"
        @click="playing = !playing"
      >
        <div
          class="w-14 h-14 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white group-hover:bg-white/15 transition-colors"
        >
          <Pause v-if="playing" :size="22" />
          <Play v-else :size="22" class="ml-0.5" />
        </div>
      </button>

      <button class="absolute top-3 right-3 p-1.5 rounded-md bg-black/40 text-gray-400 hover:text-white">
        <Maximize2 :size="14" />
      </button>
    </div>

    <div class="w-full max-w-md space-y-2">
      <div class="flex items-center gap-3">
        <button
          class="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/15"
          @click="playing = !playing"
        >
          <Play v-if="!playing" :size="14" class="ml-0.5" />
          <Pause v-else :size="14" />
        </button>
        <div class="flex-1 h-1 rounded-full bg-white/10 overflow-hidden">
          <div class="h-full w-1/3 bg-blue-500 rounded-full" />
        </div>
        <span class="text-[10px] font-mono text-gray-500">00:00 / 00:30</span>
        <Volume2 :size="14" class="text-gray-500" />
      </div>
    </div>
  </div>
</template>
