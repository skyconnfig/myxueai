import { defineStore } from 'pinia'
import { ref } from 'vue'
import { fetchTaskSummary } from '@/api/task'
import { fetchTemplates, fetchWorkspaceSummary, type VideoTemplate } from '@/api/workspace'

export const useWorkspaceStore = defineStore('workspace', () => {
  const credits = ref(12560)
  const runningCount = ref(0)
  const queueCount = ref(0)
  const recentTasks = ref<Array<{ id: string; projectName: string; type: string; status: string; progress: number }>>([])
  const templates = ref<VideoTemplate[]>([])
  const loading = ref(false)

  async function loadSummary() {
    loading.value = true
    try {
      const [workspace, tasks] = await Promise.all([
        fetchWorkspaceSummary().catch(() => null),
        fetchTaskSummary().catch(() => null),
      ])
      if (workspace) {
        credits.value = workspace.credits
        runningCount.value = workspace.runningCount
        queueCount.value = workspace.queueCount
      }
      if (tasks) {
        credits.value = tasks.credits
        runningCount.value = tasks.runningCount
        queueCount.value = tasks.queueCount
        recentTasks.value = tasks.recentTasks
      }
    } finally {
      loading.value = false
    }
  }

  async function loadTemplates() {
    try {
      templates.value = await fetchTemplates()
    } catch {
      templates.value = []
    }
  }

  return {
    credits,
    runningCount,
    queueCount,
    recentTasks,
    templates,
    loading,
    loadSummary,
    loadTemplates,
  }
})
