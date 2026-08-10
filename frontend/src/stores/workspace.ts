import { defineStore } from 'pinia'
import { ref } from 'vue'
import { createProductionTask, deleteTask, fetchTaskSummary, fetchTasks, stopTask } from '@/api/task'
import { fetchTemplates, fetchWorkspaceSummary, type VideoTemplate } from '@/api/workspace'

export const useWorkspaceStore = defineStore('workspace', () => {
  const credits = ref(0)
  const runningCount = ref(0)
  const queueCount = ref(0)
  const assetCount = ref(0)
  const avgProductionMinutes = ref<number | null>(null)
  const completedProjectCount = ref(0)
  const recentTasks = ref<Array<{
    id: string
    projectId: string
    projectName: string
    type: string
    status: string
    progress: number
    error?: string | null
    updatedAt: string
  }>>([])
  const tasks = ref<Array<{
    id: string
    projectId: string
    projectName: string
    type: string
    status: string
    progress: number
    error?: string | null
    updatedAt: string
  }>>([])
  const templates = ref<VideoTemplate[]>([])
  const loading = ref(false)

  async function loadTasks(limit = 20) {
    try {
      tasks.value = await fetchTasks({ limit })
    } catch {
      tasks.value = recentTasks.value
    }
  }

  async function refreshTasks() {
    await Promise.all([loadSummary(), loadTasks()])
  }

  async function stopTaskById(id: string) {
    await stopTask(id)
    await refreshTasks()
  }

  async function deleteTaskById(id: string) {
    await deleteTask(id)
    await refreshTasks()
  }

  async function startProductionTask(projectId: string) {
    const result = await createProductionTask(projectId)
    await refreshTasks()
    return result
  }

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
        assetCount.value = workspace.assetCount
        avgProductionMinutes.value = workspace.avgProductionMinutes
        completedProjectCount.value = workspace.completedProjectCount
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
    assetCount,
    avgProductionMinutes,
    completedProjectCount,
    recentTasks,
    tasks,
    templates,
    loading,
    loadSummary,
    loadTasks,
    refreshTasks,
    stopTaskById,
    deleteTaskById,
    startProductionTask,
    loadTemplates,
  }
})
