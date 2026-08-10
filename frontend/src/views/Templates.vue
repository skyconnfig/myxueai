<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowRight, Sparkles, Wand2 } from 'lucide-vue-next'
import { useWorkspaceStore } from '@/stores/workspace'
import type { VideoTemplate } from '@/api/workspace'

const router = useRouter()
const workspaceStore = useWorkspaceStore()

onMounted(() => {
  void workspaceStore.loadTemplates()
})

function useTemplate(tpl: VideoTemplate) {
  router.push({
    name: 'create-video',
    query: {
      prompt: tpl.prompt,
      style: tpl.style,
      duration: String(tpl.duration),
      ratio: tpl.ratio === '3:4' ? '9:16' : tpl.ratio,
    },
  })
}
</script>

<template>
  <div class="p-6 space-y-6 max-w-7xl mx-auto">
    <div class="glass-panel p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <div class="flex items-center gap-2 mb-2">
          <Wand2 class="w-4 h-4 text-accent-purple" />
          <span class="text-xs text-muted">模板市场 · Template Market</span>
        </div>
        <h1 class="text-xl font-bold text-white m-0">热门视频模板</h1>
        <p class="text-sm text-muted m-0 mt-1">一键套用爆款结构，AI 自动完成文案与分镜</p>
      </div>
      <button
        class="btn-ai-gradient px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 shrink-0"
        @click="router.push({ name: 'create-video' })"
      >
        <Sparkles class="w-4 h-4" />
        从空白创建
      </button>
    </div>

    <div v-if="!workspaceStore.templates.length" class="text-center py-16 text-muted text-sm">
      加载模板中...
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div
        v-for="tpl in workspaceStore.templates"
        :key="tpl.id"
        class="glass-panel overflow-hidden hover:border-accent-blue/40 transition-all cursor-pointer group"
        @click="useTemplate(tpl)"
      >
        <div class="relative h-40 overflow-hidden">
          <img :src="tpl.thumbnail" :alt="tpl.name" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
          <div class="absolute inset-0 bg-gradient-to-t from-dark/90 via-transparent to-transparent" />
          <span class="absolute top-3 left-3 px-2 py-0.5 glass-panel text-[10px] font-mono text-accent-purple rounded-lg">
            {{ tpl.tag }}
          </span>
          <span class="absolute bottom-3 right-3 text-[10px] font-mono text-muted">
            {{ tpl.creditsCost }} 点数
          </span>
        </div>
        <div class="p-4 space-y-2">
          <div class="flex items-center justify-between">
            <h3 class="text-base font-semibold text-white m-0">{{ tpl.name }}</h3>
            <span class="text-[10px] font-mono text-muted">{{ tpl.ratio }} · {{ tpl.duration }}s</span>
          </div>
          <p class="text-xs text-muted m-0 line-clamp-2">{{ tpl.prompt }}</p>
          <button
            class="w-full mt-2 py-2 rounded-lg text-xs font-medium bg-card border border-border text-white hover:border-accent-blue/50 flex items-center justify-center gap-1.5"
            @click.stop="useTemplate(tpl)"
          >
            使用模板
            <ArrowRight class="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
