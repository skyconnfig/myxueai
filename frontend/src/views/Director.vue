<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { fetchProject } from '@/api/project'

const route = useRoute()
const projectId = String(route.params.id)
const directorPlan = ref<Record<string, unknown> | null>(null)
const loading = ref(true)

onMounted(async () => {
  try {
    const project = await fetchProject(projectId)
    directorPlan.value = (project.directorPlan ?? project.directorBrief) as Record<string, unknown> | null
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="min-h-full p-6 max-w-3xl mx-auto space-y-4">
    <div>
      <span class="text-[11px] font-mono text-accent-purple">Director Plan</span>
      <h1 class="text-xl font-bold text-white m-0 mt-1">AI 导演方案</h1>
      <p class="text-sm text-muted m-0 mt-1">完整 DirectorPlan JSON — 逐步替代 directorBrief</p>
    </div>
    <div v-if="loading" class="text-muted text-sm">加载中...</div>
    <pre
      v-else-if="directorPlan"
      class="glass-panel p-4 text-xs text-muted overflow-auto max-h-[70vh] font-mono"
    >{{ JSON.stringify(directorPlan, null, 2) }}</pre>
    <p v-else class="text-muted text-sm">暂无导演方案，请先在 Studio 生成脚本。</p>
  </div>
</template>
