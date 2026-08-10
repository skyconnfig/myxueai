<script setup lang="ts">
import type { Component } from 'vue'

defineProps<{
  label: string
  value: string | number
  icon?: Component
  trend?: string
}>()
</script>

<template>
  <div class="xf-panel p-5 flex flex-col gap-3">
    <div class="flex items-center justify-between">
      <span class="text-xs font-medium uppercase tracking-wider text-gray-500">{{ label }}</span>
      <component :is="icon" v-if="icon" :size="16" class="text-gray-500" />
    </div>
    <div class="text-3xl font-semibold text-white tracking-tight">{{ value }}</div>
    <div v-if="trend" class="text-xs text-emerald-400">{{ trend }}</div>
  </div>
</template>
