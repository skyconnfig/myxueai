<script setup lang="ts">
import { computed } from 'vue'
import { Check, Palette, X } from 'lucide-vue-next'
import { COMMERCIAL_STYLE_PRESETS } from '@xueai/shared'

const props = defineProps<{
  show: boolean
  currentStyle?: string | null
  loading?: boolean
}>()

const emit = defineEmits<{
  close: []
  apply: [videoStyle: string]
}>()

const presets = COMMERCIAL_STYLE_PRESETS

const currentLabel = computed(() =>
  presets.find((p) => p.id === props.currentStyle)?.label ?? '未设置',
)
</script>

<template>
  <div
    v-if="show"
    class="fixed inset-0 bg-dark/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    @click.self="emit('close')"
  >
    <div class="glass-panel max-w-lg w-full p-5 space-y-4 shadow-glow-purple">
      <div class="flex items-start justify-between gap-3 border-b border-border pb-3">
        <div>
          <h3 class="text-base font-semibold text-white m-0 flex items-center gap-2">
            <Palette class="w-4 h-4 text-accent-purple" />
            改变风格
          </h3>
          <p class="text-xs text-muted m-0 mt-1">
            当前：{{ currentLabel }} · 切换后将重新生成全部画面（口播不变）
          </p>
        </div>
        <button
          type="button"
          class="text-muted hover:text-white p-1"
          :disabled="loading"
          @click="emit('close')"
        >
          <X class="w-4 h-4" />
        </button>
      </div>

      <div class="space-y-2">
        <button
          v-for="preset in presets"
          :key="preset.id"
          type="button"
          class="w-full text-left p-4 rounded-xl border transition-all disabled:opacity-50"
          :class="
            currentStyle === preset.id
              ? 'border-accent-purple/50 bg-accent-purple/10'
              : 'border-border bg-dark/40 hover:border-accent-purple/30'
          "
          :disabled="loading"
          @click="emit('apply', preset.id)"
        >
          <div class="flex items-center justify-between gap-2">
            <span class="text-sm font-semibold text-white">{{ preset.label }}</span>
            <Check v-if="currentStyle === preset.id" class="w-4 h-4 text-accent-purple shrink-0" />
          </div>
          <p class="text-[11px] text-muted m-0 mt-1 leading-relaxed">{{ preset.description }}</p>
        </button>
      </div>

      <p v-if="loading" class="text-xs text-accent-blue m-0 text-center">正在切换风格并重新生成画面...</p>
    </div>
  </div>
</template>
