<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { BarChart3, CheckCircle2, Clock, Layers, Rocket, Sparkles, Zap } from 'lucide-vue-next'
import { useProjectStore } from '@/stores/project'
import { useWorkspaceStore } from '@/stores/workspace'

const projectStore = useProjectStore()
const workspaceStore = useWorkspaceStore()

onMounted(async () => {
  await Promise.all([
    projectStore.loadProjects(),
    workspaceStore.loadSummary(),
    workspaceStore.loadTasks(50),
  ])
})

const completedProjects = computed(() =>
  projectStore.projects.filter((p) => p.status === 'COMPLETED' || p.status === 'Ready'),
)

const renderSuccessRate = computed(() => {
  const tasks = workspaceStore.tasks.length ? workspaceStore.tasks : workspaceStore.recentTasks
  if (!tasks.length) return '—'
  const done = tasks.filter((t) => t.status === 'SUCCESS').length
  return `${Math.round((done / tasks.length) * 1000) / 10}%`
})

const stats = computed(() => [
  { label: '总项目数', value: projectStore.projects.length, icon: Layers, color: 'text-accent-blue' },
  { label: '已完成', value: completedProjects.value.length, icon: CheckCircle2, color: 'text-success' },
  { label: '进行中任务', value: workspaceStore.runningCount, icon: Rocket, color: 'text-accent-purple' },
  { label: '渲染成功率', value: renderSuccessRate.value, icon: Zap, color: 'text-warning' },
  { label: '平均用时', value: workspaceStore.avgProductionMinutes ?? '—', icon: Clock, color: 'text-muted' },
  { label: 'AI 点数', value: workspaceStore.credits.toLocaleString(), icon: Sparkles, color: 'text-accent-blue' },
])
</script>

<template>
  <div class="p-6 max-w-6xl mx-auto space-y-6">
    <div>
      <div class="flex items-center gap-2 text-accent-blue mb-1">
        <BarChart3 class="w-4 h-4" />
        <span class="text-xs font-mono uppercase tracking-wider">Production Analytics</span>
      </div>
      <h1 class="text-2xl font-bold text-white m-0">生产统计</h1>
      <p class="text-sm text-muted mt-1 mb-0">任务队列、渲染成功率与资产索引概览</p>
    </div>

    <div class="grid grid-cols-2 lg:grid-cols-3 gap-4">
      <div v-for="stat in stats" :key="stat.label" class="glass-panel p-5 flex items-center justify-between">
        <div>
          <div class="text-xs text-muted">{{ stat.label }}</div>
          <div class="text-2xl font-black text-white mt-1 font-mono">{{ stat.value }}</div>
        </div>
        <component :is="stat.icon" class="w-8 h-8" :class="stat.color" />
      </div>
    </div>

    <div class="glass-panel p-5 space-y-4">
      <h2 class="text-base font-semibold text-white m-0">最近任务</h2>
      <div v-if="!workspaceStore.tasks.length && !workspaceStore.recentTasks.length" class="text-sm text-muted">
        暂无任务记录
      </div>
      <div v-else class="space-y-2">
        <div
          v-for="task in (workspaceStore.tasks.length ? workspaceStore.tasks : workspaceStore.recentTasks).slice(0, 12)"
          :key="task.id"
          class="flex items-center justify-between px-3 py-2 rounded-xl bg-dark/50 border border-border text-sm"
        >
          <span class="text-white truncate">{{ task.projectName }}</span>
          <span class="text-xs font-mono text-muted shrink-0 ml-3">{{ task.type }} · {{ task.status }}</span>
        </div>
      </div>
    </div>
  </div>
</template>
