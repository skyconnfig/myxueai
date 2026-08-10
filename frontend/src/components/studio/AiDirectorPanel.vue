<script setup lang="ts">
import { computed } from 'vue'
import { Image as ImageIcon, Lightbulb, Sparkles, Star, Trash2, Volume2 } from 'lucide-vue-next'
import type { DemoScene } from '@/data/mockData'

const props = defineProps<{
  scene?: DemoScene
  projectTopic: string
}>()

const emit = defineEmits<{
  update: [patch: Partial<DemoScene>]
  delete: []
  replaceAsset: []
  saveDraft: []
  startRender: []
}>()

const aiSuggestion = computed(() => {
  if (!props.scene) return null
  if (props.scene.duration > 12) {
    return { type: 'warning' as const, text: '这个镜头节奏偏慢，建议压缩到 8-10 秒并增加动态字幕。' }
  }
  if (props.scene.duration <= 5) {
    return { type: 'success' as const, text: '节奏紧凑，适合作为开场钩子镜头。' }
  }
  return { type: 'info' as const, text: '画面与旁白匹配良好，可考虑加入 B-roll 增强视觉层次。' }
})

const visualScore = computed(() => {
  if (!props.scene?.visual) return 3
  return props.scene.visual.length > 40 ? 5 : 4
})
</script>

<template>
  <div v-if="scene" class="flex flex-col h-full p-4 overflow-y-auto space-y-4">
    <div class="flex items-center justify-between border-b border-border pb-3">
      <div class="flex items-center gap-2">
        <Sparkles class="w-4 h-4 text-accent-blue" />
        <h3 class="text-base font-semibold text-white m-0">AI 导演面板</h3>
      </div>
      <button class="text-muted hover:text-danger p-1 rounded-lg transition-colors" @click="emit('delete')">
        <Trash2 class="w-4 h-4" />
      </button>
    </div>

    <div class="glass-panel p-3 space-y-2">
      <div class="text-[11px] font-mono text-muted uppercase">当前镜头主题</div>
      <p class="text-sm text-white m-0 font-medium">{{ scene.title }}</p>
      <p class="text-xs text-muted m-0 line-clamp-2">{{ projectTopic }}</p>
    </div>

    <div
      v-if="aiSuggestion"
      class="p-3 rounded-xl border text-xs space-y-1.5"
      :class="{
        'bg-warning/10 border-warning/30 text-warning': aiSuggestion.type === 'warning',
        'bg-success/10 border-success/30 text-success': aiSuggestion.type === 'success',
        'bg-accent-blue/10 border-accent-blue/30 text-accent-blue': aiSuggestion.type === 'info',
      }"
    >
      <div class="flex items-center gap-1.5 font-semibold">
        <Lightbulb class="w-3.5 h-3.5" />
        AI 建议
      </div>
      <p class="m-0 leading-relaxed opacity-90">{{ aiSuggestion.text }}</p>
    </div>

    <div class="grid grid-cols-2 gap-2 text-xs">
      <div class="glass-panel p-3">
        <div class="text-muted text-[11px] mb-1">视觉风格</div>
        <div class="flex items-center gap-0.5">
          <Star
            v-for="i in 5"
            :key="i"
            class="w-3 h-3"
            :class="i <= visualScore ? 'text-accent-purple fill-accent-purple' : 'text-border'"
          />
        </div>
      </div>
      <div class="glass-panel p-3">
        <div class="text-muted text-[11px] mb-1 flex items-center gap-1">
          <Volume2 class="w-3 h-3" />
          声音
        </div>
        <div class="text-white font-medium">{{ scene.voiceoverActor }}</div>
        <div class="text-muted text-[10px] mt-0.5">情绪：专业</div>
      </div>
    </div>

    <div class="space-y-3 text-xs">
      <div class="space-y-1.5">
        <label class="text-muted text-[11px] font-mono">镜头标题</label>
        <input
          :value="scene.title"
          class="w-full bg-dark/60 border border-border rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-accent-blue"
          @input="emit('update', { title: ($event.target as HTMLInputElement).value })"
        />
      </div>
      <div class="space-y-1.5">
        <div class="flex justify-between text-[11px]">
          <label class="text-muted font-mono">镜头时长</label>
          <span class="text-accent-blue font-mono font-bold">{{ scene.duration }}s</span>
        </div>
        <input
          type="range"
          min="3"
          max="30"
          :value="scene.duration"
          class="w-full accent-accent-blue cursor-pointer"
          @input="emit('update', { duration: Number(($event.target as HTMLInputElement).value) })"
        />
      </div>
      <div class="space-y-1.5">
        <label class="text-muted text-[11px] font-mono">旁白 / 口播</label>
        <textarea
          rows="3"
          :value="scene.voice"
          class="w-full bg-dark/60 border border-border rounded-xl p-2.5 text-sm text-white leading-relaxed focus:outline-none focus:border-accent-blue resize-none"
          @input="
            emit('update', {
              voice: ($event.target as HTMLTextAreaElement).value,
              description: ($event.target as HTMLTextAreaElement).value,
            })
          "
        />
      </div>
      <div class="space-y-1.5">
        <label class="text-muted text-[11px] font-mono">AI 画面 Prompt</label>
        <textarea
          rows="3"
          :value="scene.visual"
          class="w-full bg-dark/60 border border-border rounded-xl p-2 text-[11px] font-mono text-muted leading-relaxed focus:outline-none focus:border-accent-purple resize-none"
          @input="emit('update', { visual: ($event.target as HTMLTextAreaElement).value })"
        />
      </div>
      <button
        type="button"
        class="btn-soft w-full !h-10 !rounded-xl"
        @click="emit('replaceAsset')"
      >
        <ImageIcon class="w-4 h-4 text-accent-blue" />
        AI 重新生成画面
      </button>
    </div>

    <div class="flex gap-2 pt-2 mt-auto">
      <button
        type="button"
        class="btn-soft flex-1 !h-10 !rounded-xl"
        @click="emit('saveDraft')"
      >
        保存版本
      </button>
      <button
        type="button"
        class="btn-soft btn-soft--primary flex-1 !h-10 !rounded-xl"
        @click="emit('startRender')"
      >
        开始渲染
      </button>
    </div>
  </div>
  <div v-else class="flex items-center justify-center h-full text-sm text-muted p-6 text-center">
    选择左侧镜头以打开 AI 导演面板
  </div>
</template>
