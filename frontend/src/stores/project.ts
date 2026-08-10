import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Project, ProjectDetail } from '@/types'
import { createProject, deleteProject, fetchProject, fetchProjects } from '@/api/project'

export const useProjectStore = defineStore('project', () => {
  const projects = ref<Project[]>([])
  const currentProject = ref<ProjectDetail | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function loadProjects() {
    loading.value = true
    error.value = null
    try {
      projects.value = await fetchProjects()
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load projects'
      projects.value = []
    } finally {
      loading.value = false
    }
  }

  async function loadProject(id: string) {
    loading.value = true
    error.value = null
    try {
      currentProject.value = await fetchProject(id)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load project'
      currentProject.value = null
    } finally {
      loading.value = false
    }
  }

  async function addProject(payload: Parameters<typeof createProject>[0]) {
    loading.value = true
    error.value = null
    try {
      const project = await createProject(payload)
      projects.value.unshift(project)
      currentProject.value = project
      return project
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to create project'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function removeProject(id: string) {
    loading.value = true
    error.value = null
    try {
      await deleteProject(id)
      projects.value = projects.value.filter((item) => item.id !== id)
      if (currentProject.value?.id === id) {
        currentProject.value = null
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to delete project'
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    projects,
    currentProject,
    loading,
    error,
    loadProjects,
    loadProject,
    addProject,
    removeProject,
  }
})
