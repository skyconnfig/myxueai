import { computed, onActivated, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMessage } from 'naive-ui'
import { resolveVoiceSettings, isStockImageUrl } from '@xueai/shared'
import { generateScript, optimizeScript } from '@/api/script'
import { startProduction, regenerateVoice, generateSceneImages } from '@/api/production'
import { updateScene as patchScene } from '@/api/scene'
import { DEMO_ASSETS } from '@/data/mockData'
import type { DemoScene } from '@/data/mockData'
import { useProjectStore } from '@/stores/project'
import { useStudioStore } from '@/stores/studio'
import { useWorkspaceStore } from '@/stores/workspace'
import type { ProjectDetail, Scene } from '@/types'

export type StudioStep = 'inspire' | 'script' | 'storyboard' | 'material' | 'edit' | 'publish'

const PREVIEW_VOLUME_KEY = 'xueai:preview-volume'
const DEFAULT_PREVIEW_VOLUME = 0.85

function loadStoredVolume() {
  if (typeof window === 'undefined') return DEFAULT_PREVIEW_VOLUME
  const raw = window.localStorage.getItem(PREVIEW_VOLUME_KEY)
  if (raw == null) return DEFAULT_PREVIEW_VOLUME
  const parsed = Number(raw)
  if (!Number.isFinite(parsed)) return DEFAULT_PREVIEW_VOLUME
  return Math.min(1, Math.max(0, parsed))
}

function persistVolume(value: number) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(PREVIEW_VOLUME_KEY, String(value))
}

const DEFAULT_IMAGE = DEMO_ASSETS[0]?.url ?? ''

function mapScene(scene: Scene): DemoScene {
  const voice = resolveVoiceSettings(scene.voiceId, scene.voiceEmotion)
  return {
    id: scene.id,
    index: scene.order,
    title: scene.title ?? `分镜 ${scene.order}`,
    description: scene.description,
    visual: scene.visualPrompt ?? '',
    voice: scene.voiceText ?? scene.description,
    duration: scene.duration,
    cameraAngle: '特写推镜头',
    imageUrl: scene.imageUrl ?? DEFAULT_IMAGE,
    audioUrl: scene.audioUrl ?? undefined,
    voiceId: scene.voiceId ?? 'lyrical',
    voiceEmotion: scene.voiceEmotion ?? 'professional',
    voiceoverActor: voice.displayName,
    transition: 'Fade Up',
    bgmCategory: '科技脉冲',
  }
}

function mapProjectDetail(detail: ProjectDetail) {
  return {
    id: detail.id,
    name: detail.name,
    category: detail.style ?? '科技干货',
    status: detail.status,
    ratio: detail.ratio,
    duration: detail.duration,
    updatedAt: new Date(detail.updatedAt).toLocaleString(),
    thumbnail: detail.thumbnail ?? DEFAULT_IMAGE,
    scenes: detail.scenes.map(mapScene),
  }
}

export function useVideoPlanStudio() {
  const route = useRoute()
  const router = useRouter()
  const message = useMessage()
  const projectStore = useProjectStore()
  const studioStore = useStudioStore()
  const workspaceStore = useWorkspaceStore()

  const projectId = computed(() => String(route.params.id))
  const isDemoProject = computed(() => projectId.value.startsWith('demo-'))
  const isLoading = ref(false)
  const loadError = ref<string | null>(null)

  const activeStep = ref<StudioStep>('storyboard')
  const selectedSceneId = ref('')
  const isPlaying = ref(false)
  const currentTime = ref(0)
  const showSubtitles = ref(true)
  const isMuted = ref(false)
  const volume = ref(loadStoredVolume())
  const aiPromptTopic = ref('')
  const aiStyle = ref('专业干货 / 深度解析')
  const isGenerating = ref(false)
  const isOptimizing = ref(false)
  const isRedubbing = ref(false)
  const isGeneratingImages = ref(false)
  const generationNotice = ref<string | null>(null)
  const showAssetPicker = ref(false)
  const scriptSource = ref<'llm' | 'preset' | null>(null)

  const project = computed(() => {
    if (isDemoProject.value) {
      return studioStore.getProjectById(projectId.value)
    }
    if (projectStore.currentProject?.id === projectId.value) {
      return mapProjectDetail(projectStore.currentProject)
    }
    return {
      id: projectId.value,
      name: '加载中...',
      category: '科技干货',
      status: 'DRAFT' as const,
      ratio: '9:16' as const,
      duration: 30,
      updatedAt: '',
      thumbnail: DEFAULT_IMAGE,
      scenes: [] as DemoScene[],
    }
  })

  const selectedScene = computed(
    () => project.value.scenes.find((s) => s.id === selectedSceneId.value) ?? project.value.scenes[0],
  )

  const totalDuration = computed(() =>
    project.value.scenes.reduce((acc, s) => acc + s.duration, 0),
  )

  const activePlayingScene = computed(() => {
    let accumulated = 0
    for (const scene of project.value.scenes) {
      accumulated += scene.duration
      if (currentTime.value <= accumulated) return scene
    }
    return selectedScene.value
  })

  const activeSceneStartTime = computed(() => {
    let accumulated = 0
    for (const scene of project.value.scenes) {
      if (scene.id === activePlayingScene.value?.id) return accumulated
      accumulated += scene.duration
    }
    return 0
  })

  function sceneStartTimeFor(sceneId: string) {
    let accumulated = 0
    for (const scene of project.value.scenes) {
      if (scene.id === sceneId) return accumulated
      accumulated += scene.duration
    }
    return 0
  }

  const previewScene = computed(() =>
    isPlaying.value ? activePlayingScene.value : selectedScene.value,
  )

  const previewSceneStartTime = computed(() => {
    const scene = previewScene.value
    if (!scene) return 0
    return sceneStartTimeFor(scene.id)
  })

  const generateProgress = computed(() => {
    if (project.value.scenes.length === 0) return 15
    if (activeStep.value === 'material') return 55
    if (activeStep.value === 'edit') return 75
    if (activeStep.value === 'publish') return 95
    return 40
  })

  async function loadProjectData() {
    if (isDemoProject.value) return
    isLoading.value = true
    loadError.value = null
    try {
      await projectStore.loadProject(projectId.value)
      const detail = projectStore.currentProject
      if (detail) {
        aiPromptTopic.value = detail.prompt
        aiStyle.value = detail.style ?? '专业干货 / 深度解析'
        studioStore.aspectRatio = detail.ratio
        if (detail.scenes[0]) selectedSceneId.value = detail.scenes[0].id
        activeStep.value = detail.scenes.length ? 'storyboard' : 'inspire'
        if (detail.scenes.some(sceneNeedsMatchedImage)) {
          isGeneratingImages.value = true
          generationNotice.value = '正在为分镜生成与口播匹配的画面...'
          void generateSceneImages(projectId.value)
            .then((updated) => {
              projectStore.currentProject = updated
            })
            .catch(() => {
              message.warning('部分画面生成失败，可点击「AI 重新生成画面」重试')
            })
            .finally(() => {
              isGeneratingImages.value = false
            })
          startImagePolling()
        }
      }
    } catch (err) {
      loadError.value = err instanceof Error ? err.message : '加载项目失败'
      message.error(loadError.value)
    } finally {
      isLoading.value = false
    }
  }

  watch(
    () => route.fullPath,
    () => {
      void loadProjectData()
    },
  )

  let timer: number | undefined
  watch(isPlaying, (playing, wasPlaying) => {
    if (playing && !wasPlaying && selectedSceneId.value) {
      currentTime.value = sceneStartTimeFor(selectedSceneId.value)
    }
    if (playing) {
      timer = window.setInterval(() => {
        currentTime.value = currentTime.value >= totalDuration.value ? 0 : currentTime.value + 0.2
        if (currentTime.value >= totalDuration.value) isPlaying.value = false
      }, 200)
    } else if (timer) {
      window.clearInterval(timer)
    }
  }, { flush: 'sync' })

  onMounted(() => {
    void loadProjectData()
  })

  onActivated(() => {
    if (!isDemoProject.value) void loadProjectData()
  })

  onUnmounted(() => {
    if (timer) window.clearInterval(timer)
    if (imagePollTimer) window.clearInterval(imagePollTimer)
  })

  let imagePollTimer: number | undefined

  function sceneNeedsMatchedImage(scene: Scene) {
    if (!scene.imageUrl) return true
    if (scene.imageSource === 'manual') return false
    return isStockImageUrl(scene.imageUrl) || scene.imageUrl.endsWith('.svg')
  }

  function startImagePolling() {
    if (imagePollTimer) window.clearInterval(imagePollTimer)
    let attempts = 0
    imagePollTimer = window.setInterval(async () => {
      attempts += 1
      try {
        await projectStore.loadProject(projectId.value)
      } catch {
        /* ignore transient poll errors */
      }
      const scenes = projectStore.currentProject?.scenes ?? []
      const pending = scenes.some(sceneNeedsMatchedImage)
      if (!pending || attempts >= 40) {
        if (imagePollTimer) window.clearInterval(imagePollTimer)
        imagePollTimer = undefined
        isGeneratingImages.value = false
        if (!pending && scenes.length > 0) {
          generationNotice.value = '口播与画面已自动匹配'
          window.setTimeout(() => {
            generationNotice.value = null
          }, 3000)
        }
      }
    }, 3000)
  }

  watch(
    project,
    (value) => {
      if (value.scenes[0] && !selectedSceneId.value) {
        selectedSceneId.value = value.scenes[0].id
      }
      studioStore.aspectRatio = value.ratio
    },
    { immediate: true },
  )

  watch(projectId, () => {
    selectedSceneId.value = ''
    scriptSource.value = null
    void loadProjectData()
  })

  watch(volume, (value) => {
    persistVolume(value)
  })

  const scenePatchTimers = new Map<string, number>()

  function applyLocalScenePatch(sceneId: string, patch: Partial<DemoScene>) {
    if (isDemoProject.value) {
      studioStore.updateScene(projectId.value, sceneId, patch)
      return
    }
    const detail = projectStore.currentProject
    if (!detail) return
    projectStore.currentProject = {
      ...detail,
      scenes: detail.scenes.map((scene) => {
        if (scene.id !== sceneId) return scene
        return {
          ...scene,
          title: patch.title ?? scene.title,
          description: patch.description ?? scene.description,
          visualPrompt: patch.visual ?? scene.visualPrompt,
          voiceText: patch.voice ?? scene.voiceText,
          duration: patch.duration ?? scene.duration,
          imageUrl: patch.imageUrl ?? scene.imageUrl,
          voiceId: patch.voiceId ?? scene.voiceId,
          voiceEmotion: patch.voiceEmotion ?? scene.voiceEmotion,
        }
      }),
    }
  }

  function updateScene(
    sceneId: string,
    patch: Partial<DemoScene> & { imageSource?: 'ai' | 'manual' },
  ) {
    applyLocalScenePatch(sceneId, patch)
    if (isDemoProject.value) return

    const apiPatch = {
      ...(patch.title !== undefined ? { title: patch.title } : {}),
      ...(patch.description !== undefined ? { description: patch.description } : {}),
      ...(patch.visual !== undefined ? { visualPrompt: patch.visual } : {}),
      ...(patch.voice !== undefined ? { voiceText: patch.voice } : {}),
      ...(patch.duration !== undefined ? { duration: patch.duration } : {}),
      ...(patch.imageUrl !== undefined ? { imageUrl: patch.imageUrl } : {}),
      ...(patch.imageSource !== undefined ? { imageSource: patch.imageSource } : {}),
      ...(patch.voiceId !== undefined ? { voiceId: patch.voiceId } : {}),
      ...(patch.voiceEmotion !== undefined ? { voiceEmotion: patch.voiceEmotion } : {}),
    }
    if (Object.keys(apiPatch).length === 0) return

    const existing = scenePatchTimers.get(sceneId)
    if (existing) window.clearTimeout(existing)
    scenePatchTimers.set(
      sceneId,
      window.setTimeout(async () => {
        try {
          const updated = await patchScene(sceneId, apiPatch)
          projectStore.currentProject = updated
        } catch (err) {
          message.error(err instanceof Error ? err.message : '保存分镜失败')
        }
      }, 500),
    )
  }

  async function handleGenerate() {
    if (!aiPromptTopic.value.trim()) return

    if (isDemoProject.value) {
      isGenerating.value = true
      generationNotice.value = '演示模式：AI 正在编排故事板...'
      window.setTimeout(() => {
        isGenerating.value = false
        activeStep.value = 'storyboard'
        generationNotice.value = '演示模式：故事板已就绪'
        window.setTimeout(() => {
          generationNotice.value = null
        }, 4000)
      }, 2000)
      return
    }

    isGenerating.value = true
    generationNotice.value = 'AI 导演正在编排文案、分镜与节奏...'
    try {
      const result = await generateScript({
        projectId: projectId.value,
        prompt: aiPromptTopic.value.trim(),
        style: aiStyle.value,
        duration: project.value.duration,
        ratio: project.value.ratio,
      })
      projectStore.currentProject = result.project
      scriptSource.value = result.source
      activeStep.value = 'storyboard'
      if (result.project.scenes[0]) selectedSceneId.value = result.project.scenes[0].id
      const sourceLabel = result.source === 'llm' ? 'DeepSeek AI' : '智能预设'
      generationNotice.value = `已完成 ${result.project.scenes.length} 镜头（${sourceLabel}），正在生成匹配画面...`
      if (result.notice) message.warning(result.notice)
      else message.success('AI 故事板生成成功')
      isGeneratingImages.value = true
      startImagePolling()
      void workspaceStore.loadSummary()
    } catch (err) {
      message.error(err instanceof Error ? err.message : '生成失败')
      generationNotice.value = null
    } finally {
      isGenerating.value = false
      window.setTimeout(() => {
        generationNotice.value = null
      }, 4000)
    }
  }

  async function handleAiOptimize() {
    if (project.value.scenes.length === 0) {
      message.warning('请先生成分镜后再优化')
      return
    }

    if (isDemoProject.value) {
      isOptimizing.value = true
      generationNotice.value = '演示模式：AI 正在优化口播与画面描述...'
      window.setTimeout(() => {
        const scene = selectedScene.value
        if (scene) {
          updateScene(scene.id, {
            voice: trimDemoVoice(scene.voice),
            visual: `${scene.visual}, cinematic lighting, vertical frame`,
          })
        }
        isOptimizing.value = false
        generationNotice.value = '演示模式：当前分镜已优化'
        message.success('AI 优化完成（演示）')
        window.setTimeout(() => {
          generationNotice.value = null
        }, 3000)
      }, 1500)
      return
    }

    if (isOptimizing.value) return

    isOptimizing.value = true
    generationNotice.value = selectedSceneId.value
      ? 'AI 正在优化当前分镜...'
      : 'AI 正在优化全部口播与画面描述...'
    try {
      const result = await optimizeScript({
        projectId: projectId.value,
        sceneId: selectedSceneId.value || undefined,
        style: aiStyle.value,
      })
      projectStore.currentProject = result.project
      const sourceLabel = result.source === 'llm' ? 'DeepSeek AI' : '智能规则'
      generationNotice.value = result.summary ?? `已优化 ${result.optimizedCount} 个分镜（${sourceLabel}）`
      if (result.notice) message.warning(result.notice)
      else message.success(result.summary ?? 'AI 优化完成')
      isGeneratingImages.value = true
      startImagePolling()
      void workspaceStore.loadSummary()
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'AI 优化失败')
      generationNotice.value = null
    } finally {
      isOptimizing.value = false
      window.setTimeout(() => {
        generationNotice.value = null
      }, 4000)
    }
  }

  function trimDemoVoice(text: string) {
    const clean = text.trim()
    return clean.length > 32 ? `${clean.slice(0, 31)}…` : clean
  }

  function handleAddScene() {
    if (!isDemoProject.value) {
      message.info('正式项目请通过 AI 重新生成故事板')
      return
    }
    const scenes = [...project.value.scenes]
    const newScene: DemoScene = {
      id: `sc-${Date.now()}`,
      index: scenes.length + 1,
      title: `新分镜片段 ${scenes.length + 1}`,
      description: '请输入新的旁白或口播文案...',
      visual: 'Minimalist high resolution dark theme video clip frame',
      voice: '请输入新的旁白或口播文案...',
      duration: 8,
      cameraAngle: '特写',
      imageUrl: DEMO_ASSETS[0].url,
      voiceId: 'lyrical',
      voiceEmotion: 'professional',
      voiceoverActor: '云希 (科技专业)',
      transition: 'Fade Up',
      bgmCategory: '科技律动',
    }
    studioStore.updateProjectScenes(projectId.value, [...scenes, newScene])
    selectedSceneId.value = newScene.id
  }

  function handleDeleteScene(sceneId: string) {
    if (project.value.scenes.length <= 1) return
    const scenes = project.value.scenes.filter((s) => s.id !== sceneId)
    if (isDemoProject.value) {
      studioStore.updateProjectScenes(projectId.value, scenes)
    }
    selectedSceneId.value = scenes[0].id
  }

  async function handleRedub() {
    if (project.value.scenes.length === 0) {
      message.warning('请先生成分镜后再配音')
      return
    }

    if (isDemoProject.value) {
      message.info('演示模式暂不支持重新配音')
      return
    }

    if (isRedubbing.value) return

    isRedubbing.value = true
    generationNotice.value = '正在重新生成配音...'
    try {
      const updated = await regenerateVoice(projectId.value)
      projectStore.currentProject = updated
      generationNotice.value = '配音已更新，点击播放试听'
      message.success('配音生成完成')
    } catch (err) {
      message.error(err instanceof Error ? err.message : '配音生成失败')
      generationNotice.value = null
    } finally {
      isRedubbing.value = false
      window.setTimeout(() => {
        generationNotice.value = null
      }, 4000)
    }
  }

  async function handleRegenerateImage(sceneId?: string) {
    const targetId = sceneId ?? selectedSceneId.value
    if (!targetId) {
      message.warning('请先选择分镜')
      return
    }

    if (isDemoProject.value) {
      message.info('演示模式暂不支持生成画面')
      return
    }

    if (isGeneratingImages.value) return

    isGeneratingImages.value = true
    generationNotice.value = '正在根据口播与画面描述生成匹配镜头...'
    try {
      const updated = await generateSceneImages(projectId.value, targetId)
      projectStore.currentProject = updated
      message.success('画面已更新')
      generationNotice.value = '当前分镜画面已与文案匹配'
    } catch (err) {
      message.error(err instanceof Error ? err.message : '画面生成失败')
      generationNotice.value = null
    } finally {
      isGeneratingImages.value = false
      window.setTimeout(() => {
        generationNotice.value = null
      }, 3000)
    }
  }

  async function goToProduction() {
    if (isDemoProject.value) {
      await router.push({ name: 'production', params: { id: projectId.value } })
      return
    }
    try {
      await startProduction(projectId.value)
      void workspaceStore.loadSummary()
    } catch (err) {
      message.error(err instanceof Error ? err.message : '无法启动生产流水线')
      return
    }
    await router.push({ name: 'production', params: { id: projectId.value } })
  }

  return {
    route,
    router,
    projectId,
    isDemoProject,
    isLoading,
    loadError,
    activeStep,
    selectedSceneId,
    isPlaying,
    currentTime,
    showSubtitles,
    isMuted,
    volume,
    aiPromptTopic,
    aiStyle,
    isGenerating,
    isOptimizing,
    isRedubbing,
    isGeneratingImages,
    generationNotice,
    showAssetPicker,
    scriptSource,
    project,
    selectedScene,
    totalDuration,
    activePlayingScene,
    activeSceneStartTime,
    previewScene,
    previewSceneStartTime,
    generateProgress,
    updateScene,
    handleGenerate,
    handleAiOptimize,
    handleRedub,
    handleRegenerateImage,
    handleAddScene,
    handleDeleteScene,
    goToProduction,
  }
}
