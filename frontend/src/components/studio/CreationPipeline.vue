<script setup lang="ts">
import { computed } from 'vue'
import { Check, ChevronRight, Circle, Sparkles } from 'lucide-vue-next'
import type { StudioStep } from '@/composables/useVideoPlanStudio'

const props = defineProps<{
  currentStep: StudioStep
  hasScenes: boolean
}>()

const emit = defineEmits<{
  'update:currentStep': [step: StudioStep]
}>()

const steps = [
  { id: 'inspire' as const, num: 1, label: '灵感输入' },
  { id: 'script' as const, num: 2, label: 'AI 脚本' },
  { id: 'storyboard' as const, num: 3, label: '自动分镜' },
  { id: 'material' as const, num: 4, label: '素材生成' },
  { id: 'edit' as const, num: 5, label: '自动剪辑' },
  { id: 'publish' as const, num: 6, label: '发布' },
]

const resolvedStep = computed(() => {
  if (!props.hasScenes && props.currentStep === 'storyboard') return 'script'
  return props.currentStep
})

const currentIndex = computed(() =>
  steps.findIndex((s) => s.id === resolvedStep.value),
)

function stepState(index: number) {
  if (index < currentIndex.value) return 'done'
  if (index === currentIndex.value) return 'active'
  return 'pending'
}
</script>

<template>
  <div class="mx-4 mt-3 mb-2 px-3 py-3 shrink-0 bg-surface border border-border rounded-xl">
    <div class="flex items-center justify-between gap-4 mb-3 px-1">
      <div class="flex items-center gap-2">
        <Sparkles class="w-4 h-4 text-accent-blue" />
        <span class="text-sm font-medium text-white">AI 视频生产流程</span>
      </div>
      <div class="hidden md:inline-flex btn-soft !h-7 !px-2.5 !rounded-lg !text-[11px] !font-normal pointer-events-none">
        <span class="text-muted">当前</span>
        <span class="text-accent-blue">{{ steps[currentIndex]?.label ?? '准备中' }}</span>
      </div>
    </div>

    <div class="flex items-center gap-1 overflow-x-auto pb-1">
      <template v-for="(step, index) in steps" :key="step.id">
        <button
          type="button"
          class="btn-nav !w-auto shrink-0 !px-2.5 !py-1.5 !text-xs"
          :class="stepState(index) === 'active' ? 'btn-nav--active' : ''"
          @click="emit('update:currentStep', step.id)"
        >
          <span
            class="w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-semibold shrink-0 border"
            :class="{
              'bg-accent-blue/15 border-accent-blue/40 text-accent-blue': stepState(index) === 'active',
              'bg-card border-border text-accent-blue': stepState(index) === 'done',
              'bg-transparent border-border text-muted': stepState(index) === 'pending',
            }"
          >
            <Check v-if="stepState(index) === 'done'" class="w-3 h-3" />
            <span v-else>{{ step.num }}</span>
          </span>
          <span :class="stepState(index) === 'pending' ? 'text-muted' : 'text-white'">
            {{ step.label }}
          </span>
        </button>
        <ChevronRight
          v-if="index < steps.length - 1"
          class="w-3.5 h-3.5 text-border shrink-0 hidden sm:block"
        />
      </template>
    </div>

    <div class="mt-3 flex items-center gap-3 px-1">
      <div class="flex-1 h-1 rounded-full bg-dark overflow-hidden border border-border">
        <div
          class="h-full rounded-full bg-accent-blue transition-all duration-500"
          :style="{ width: `${Math.max(((currentIndex + 1) / steps.length) * 100, 8)}%` }"
        />
      </div>
      <span class="text-[11px] font-mono text-muted shrink-0">
        {{ currentIndex + 1 }}/{{ steps.length }}
      </span>
    </div>

    <div v-if="!hasScenes" class="mt-2 flex items-center gap-2 text-xs text-muted px-1">
      <Circle class="w-3 h-3 text-accent-blue" />
      <span>输入想法后点击「AI 创建视频」，系统将自动完成文案与分镜</span>
    </div>
  </div>
</template>
