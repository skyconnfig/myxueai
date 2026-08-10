<script setup lang="ts">
import { ref, watch } from 'vue'
import {
  NButton,
  NInput,
  NSelect,
  NSlider,
} from 'naive-ui'
import { Sparkles, Trash2 } from 'lucide-vue-next'

const props = defineProps<{
  title: string
  duration: number
  voiceText: string
  visualPrompt: string
}>()

const emit = defineEmits<{
  'update:title': [value: string]
  'update:duration': [value: number]
  'update:voiceText': [value: string]
  'update:visualPrompt': [value: string]
}>()

const localTitle = ref(props.title)
const localDuration = ref(props.duration)
const localVoice = ref(props.voiceText)
const localPrompt = ref(props.visualPrompt)

watch(
  () => props,
  (value) => {
    localTitle.value = value.title
    localDuration.value = value.duration
    localVoice.value = value.voiceText
    localPrompt.value = value.visualPrompt
  },
  { deep: true },
)

const voiceOptions = [
  { label: '云希 - 科技专业男声', value: 'yunxi' },
  { label: '晓晓 - 自然女声', value: 'xiaoxiao' },
  { label: '英文 - Adam', value: 'adam' },
]

const cameraOptions = [
  { label: '特写 Close-up', value: 'close-up' },
  { label: '中景 Medium', value: 'medium' },
  { label: '远景 Wide', value: 'wide' },
]
</script>

<template>
  <div class="xf-panel h-full flex flex-col overflow-hidden">
    <div class="xf-panel-header flex items-center justify-between">
      <span>Inspector · 镜头属性</span>
      <button class="p-1 rounded text-gray-500 hover:text-red-400 transition-colors">
        <Trash2 :size="14" />
      </button>
    </div>

    <div class="flex-1 overflow-y-auto p-4 space-y-5">
      <div class="space-y-2">
        <label class="text-xs text-gray-500">Scene Title</label>
        <NInput
          v-model:value="localTitle"
          size="small"
          @update:value="emit('update:title', $event)"
        />
      </div>

      <div class="space-y-2">
        <div class="flex items-center justify-between">
          <label class="text-xs text-gray-500">Duration</label>
          <span class="text-xs font-mono text-blue-400">{{ localDuration }}s</span>
        </div>
        <NSlider
          v-model:value="localDuration"
          :min="3"
          :max="30"
          :step="1"
          @update:value="emit('update:duration', $event)"
        />
      </div>

      <div class="space-y-2">
        <label class="text-xs text-gray-500">Voiceover / Subtitle</label>
        <NInput
          v-model:value="localVoice"
          type="textarea"
          :rows="3"
          @update:value="emit('update:voiceText', $event)"
        />
      </div>

      <div class="space-y-2">
        <label class="text-xs text-gray-500">AI Voice</label>
        <NSelect :options="voiceOptions" default-value="yunxi" size="small" />
      </div>

      <div class="space-y-2">
        <label class="text-xs text-gray-500">Camera Movement</label>
        <NSelect :options="cameraOptions" default-value="close-up" size="small" />
      </div>

      <div class="space-y-2">
        <div class="flex items-center justify-between">
          <label class="text-xs text-gray-500">Visual Prompt</label>
          <NButton size="tiny" quaternary type="primary">
            <template #icon><Sparkles :size="12" /></template>
            优化
          </NButton>
        </div>
        <NInput
          v-model:value="localPrompt"
          type="textarea"
          :rows="4"
          class="font-mono text-xs"
          @update:value="emit('update:visualPrompt', $event)"
        />
      </div>
    </div>

    <div class="p-4 border-t border-white/8">
      <NButton block secondary size="small">从素材库替换当前帧</NButton>
    </div>
  </div>
</template>
