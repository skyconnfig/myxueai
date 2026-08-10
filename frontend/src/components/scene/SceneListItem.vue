<script setup lang="ts">
import { GripVertical } from 'lucide-vue-next'

defineProps<{
  order: number
  title: string
  description: string
  duration: number
  active?: boolean
}>()

defineEmits<{
  select: []
}>()
</script>

<template>
  <div
    class="group flex gap-3 p-3 rounded-xl border cursor-pointer transition-all"
    :class="
      active
        ? 'bg-blue-500/10 border-blue-500/40 shadow-[0_0_0_1px_rgba(59,130,246,0.2)]'
        : 'bg-white/[0.02] border-white/8 hover:bg-white/[0.04] hover:border-white/12'
    "
    @click="$emit('select')"
  >
    <div class="flex flex-col items-center gap-1 pt-0.5 text-gray-600">
      <GripVertical :size="14" class="opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>

    <div class="flex-1 min-w-0 space-y-1.5">
      <div class="flex items-center justify-between gap-2">
        <span
          class="text-[10px] font-bold tracking-wider uppercase"
          :class="active ? 'text-blue-400' : 'text-gray-500'"
        >
          Scene #{{ order }}
        </span>
        <span class="text-[10px] font-mono text-gray-500">{{ duration }}s</span>
      </div>
      <div class="text-sm font-medium text-white truncate">{{ title }}</div>
      <div class="text-xs text-gray-500 line-clamp-2 leading-relaxed">{{ description }}</div>
    </div>
  </div>
</template>
