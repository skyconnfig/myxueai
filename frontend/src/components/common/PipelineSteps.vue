<script setup lang="ts">
import { Check } from 'lucide-vue-next'

defineProps<{
  steps: readonly { key: string; label: string }[]
  activeStep: string
  completedSteps?: string[]
}>()
</script>

<template>
  <div class="flex items-center gap-1 overflow-x-auto py-1">
    <template v-for="(step, index) in steps" :key="step.key">
      <div
        class="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors"
        :class="[
          activeStep === step.key
            ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
            : completedSteps?.includes(step.key)
              ? 'text-emerald-400'
              : 'text-gray-500',
        ]"
      >
        <Check v-if="completedSteps?.includes(step.key)" :size="12" />
        <span>{{ step.label }}</span>
      </div>
      <div
        v-if="index < steps.length - 1"
        class="w-8 h-px shrink-0"
        :class="completedSteps?.includes(step.key) ? 'bg-emerald-500/40' : 'bg-white/10'"
      />
    </template>
  </div>
</template>
