import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { DEMO_PROJECTS, type DemoProject, type DemoScene } from '@/data/mockData'
import type { VideoRatio } from '@/types'

export const useStudioStore = defineStore('studio', () => {
  const projects = ref<DemoProject[]>([...DEMO_PROJECTS])
  const currentProjectId = ref(DEMO_PROJECTS[0].id)
  const aspectRatio = ref<VideoRatio>('9:16')
  const isSaving = ref(false)

  const currentProject = computed(
    () => projects.value.find((p) => p.id === currentProjectId.value) ?? projects.value[0],
  )

  function selectProject(id: string) {
    currentProjectId.value = id
    const project = projects.value.find((p) => p.id === id)
    if (project) aspectRatio.value = project.ratio
  }

  function getProjectById(id: string) {
    return projects.value.find((p) => p.id === id) ?? DEMO_PROJECTS[0]
  }

  function updateProjectScenes(projectId: string, scenes: DemoScene[]) {
    const project = projects.value.find((p) => p.id === projectId)
    if (!project) return
    project.scenes = scenes
    project.duration = scenes.reduce((sum, s) => sum + s.duration, 0)
    flashSaving()
  }

  function updateScene(projectId: string, sceneId: string, patch: Partial<DemoScene>) {
    const project = projects.value.find((p) => p.id === projectId)
    if (!project) return
    project.scenes = project.scenes.map((s) => (s.id === sceneId ? { ...s, ...patch } : s))
    project.duration = project.scenes.reduce((sum, s) => sum + s.duration, 0)
    flashSaving()
  }

  function flashSaving() {
    isSaving.value = true
    window.setTimeout(() => {
      isSaving.value = false
    }, 500)
  }

  return {
    projects,
    currentProjectId,
    currentProject,
    aspectRatio,
    isSaving,
    selectProject,
    getProjectById,
    updateProjectScenes,
    updateScene,
  }
})
