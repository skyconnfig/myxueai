<script setup lang="ts">
import { CheckCircle2, Clock, Circle, Plus, Sparkles, Wand2 } from 'lucide-vue-next'
import type { DemoScene } from '@/data/mockData'

defineProps<{
  topic: string
  style: string
  isGenerating: boolean
  scenes: DemoScene[]
  selectedSceneId: string
  scriptSource: 'llm' | 'preset' | null
}>()

const emit = defineEmits<{
  'update:topic': [value: string]
  'update:style': [value: string]
  generate: []
  addScene: []
  selectScene: [id: string]
}>()

const aiCapabilities = ['文案', '分镜', '配音', '素材', '字幕', 'BGM']
</script>

<template>
  <div class="flex flex-col h-full overflow-y-auto p-4 space-y-4">
    <div class="glass-panel p-4 space-y-4">
      <div class="flex items-start justify-between gap-2">
        <div>
          <div class="flex items-center gap-2 mb-1">
            <Wand2 class="w-4 h-4 text-accent-blue" />
            <h2 class="text-base font-semibold text-white m-0">告诉 AI 你想做什么</h2>
          </div>
          <p class="text-xs text-muted m-0 leading-relaxed">
            只需描述想法，AI 自动完成后续生产链路
          </p>
        </div>
        <span class="btn-soft !h-6 !px-2 !rounded-lg !text-[10px] !font-normal pointer-events-none shrink-0">
          <span class="text-accent-blue">DeepSeek</span>
        </span>
      </div>

      <textarea
        :value="topic"
        rows="3"
        placeholder="例如：制作一个 30 秒介绍 AI 自动化办公的短视频，面向职场人群，风格专业但有温度..."
        class="w-full bg-dark/60 border border-border rounded-xl px-3 py-2.5 text-sm text-white placeholder-muted focus:outline-none focus:border-accent-blue focus:ring-1 focus:ring-accent-blue/30 resize-none"
        @input="emit('update:topic', ($event.target as HTMLTextAreaElement).value)"
      />

      <select
        :value="style"
        class="w-full bg-dark/60 border border-border rounded-xl text-sm text-white px-3 py-2 focus:outline-none focus:border-accent-blue"
        @change="emit('update:style', ($event.target as HTMLSelectElement).value)"
      >
        <option>专业干货 / 深度解析</option>
        <option>黄金3秒爆款钩子</option>
        <option>商业故事 / 案例拆解</option>
      </select>

      <div class="grid grid-cols-3 gap-2">
        <div
          v-for="cap in aiCapabilities"
          :key="cap"
          class="flex items-center gap-1.5 text-[11px] text-muted bg-dark/40 border border-border/60 rounded-lg px-2 py-1.5"
        >
          <CheckCircle2 class="w-3 h-3 text-success shrink-0" />
          <span>{{ cap }}</span>
        </div>
      </div>

      <button
        type="button"
        class="btn-soft btn-soft--primary w-full !h-10 !rounded-xl text-sm disabled:opacity-50"
        :disabled="isGenerating || !topic.trim()"
        @click="emit('generate')"
      >
        <Sparkles class="w-4 h-4 text-accent-blue" />
        {{ isGenerating ? 'AI 创作中...' : 'AI 创建视频' }}
      </button>
    </div>

    <div class="glass-panel p-3 space-y-2">
      <div class="text-[11px] font-mono text-muted uppercase tracking-wider font-semibold">
        生产链路状态
      </div>
      <div class="grid grid-cols-2 gap-2 text-[11px] font-mono">
        <div class="flex items-center gap-1.5" :class="scenes.length ? 'text-success' : 'text-muted'">
          <CheckCircle2 v-if="scenes.length" class="w-3.5 h-3.5" />
          <Clock v-else class="w-3.5 h-3.5" />
          脚本 {{ scenes.length ? '✓' : '○' }}
        </div>
        <div class="flex items-center gap-1.5" :class="scenes.length ? 'text-success' : 'text-muted'">
          <CheckCircle2 v-if="scenes.length" class="w-3.5 h-3.5" />
          <Circle v-else class="w-3 h-3" />
          分镜 {{ scenes.length ? '✓' : '○' }}
        </div>
        <div class="flex items-center gap-1.5 text-warning">
          <Clock class="w-3.5 h-3.5" />
          素材 ⏳
        </div>
        <div class="flex items-center gap-1.5 text-muted">
          <Circle class="w-3 h-3" />
          渲染 ○
        </div>
      </div>
      <p v-if="scriptSource" class="text-[10px] text-muted m-0 pt-1 border-t border-border/60">
        来源：{{ scriptSource === 'llm' ? 'DeepSeek AI 实时生成' : '智能预设引擎' }}
      </p>
    </div>

    <div class="space-y-2 flex-1 min-h-0">
      <div class="flex items-center justify-between px-1">
        <span class="text-xs font-semibold text-white">故事镜头 ({{ scenes.length }})</span>
        <button class="text-accent-blue hover:underline text-[11px] flex items-center gap-1" @click="emit('addScene')">
          <Plus class="w-3.5 h-3.5" />
          添加
        </button>
      </div>

      <div v-if="!scenes.length" class="glass-panel p-6 text-center text-xs text-muted">
        暂无镜头。完成 AI 创建后，故事板将出现在这里。
      </div>

      <div class="space-y-2 max-h-[calc(100vh-32rem)] overflow-y-auto pr-1">
        <button
          v-for="(scene, idx) in scenes"
          :key="scene.id"
          class="w-full text-left p-3 rounded-xl border text-xs transition-all space-y-1.5"
          :class="
            scene.id === selectedSceneId
              ? 'btn-nav--active border border-border'
              : 'bg-card/40 border border-border hover:border-accent-blue/40'
          "
          @click="emit('selectScene', scene.id)"
        >
          <div class="flex items-center justify-between text-[11px]">
            <span class="font-mono font-bold text-accent-blue">SCENE #{{ idx + 1 }}</span>
            <span class="text-muted font-mono">{{ scene.duration }}s</span>
          </div>
          <div class="font-semibold text-white truncate">{{ scene.title }}</div>
          <p class="text-[11px] text-muted line-clamp-2 leading-relaxed m-0">{{ scene.description }}</p>
        </button>
      </div>
    </div>
  </div>
</template>
