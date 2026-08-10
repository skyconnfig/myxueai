import { computed, ref } from 'vue'
import type { VideoPlan, VideoPlanScene } from '@/types'

export interface StudioScene extends VideoPlanScene {
  id: string
  title: string
}

const demoScenes: StudioScene[] = [
  {
    id: '1',
    index: 1,
    title: '黄金3秒钩子',
    duration: 8,
    description: 'AI 正在重塑世界，而你还在手动剪辑？',
    visual: 'Futuristic AI brain hologram, dark tech background, cinematic lighting',
    voice: 'AI 正在重塑世界，而你还在手动剪辑？',
  },
  {
    id: '2',
    index: 2,
    title: '痛点共鸣',
    duration: 10,
    description: '展示传统剪辑的繁琐：找素材、对字幕、调音轨...',
    visual: 'Stressed editor at desk, multiple screens, messy timeline, blue light',
    voice: '找素材、对字幕、调音轨，一个短视频要花掉你整个下午。',
  },
  {
    id: '3',
    index: 3,
    title: '产品亮相',
    duration: 7,
    description: 'XueAI Video Factory 一键生成界面展示',
    visual: 'Clean SaaS dashboard UI, video generation interface, professional',
    voice: 'XueAI Video Factory，输入一句话，AI 自动完成全流程。',
  },
  {
    id: '4',
    index: 4,
    title: '行动号召',
    duration: 5,
    description: '品牌 Logo + 立即体验按钮',
    visual: 'Brand logo animation, call to action button, gradient background',
    voice: '立即体验，让 AI 成为你的视频团队。',
  },
]

export function useMockVideoPlan() {
  const plan = ref<VideoPlan>({
    title: 'AI 学习 30 天，我发现了视频生产的终极秘密',
    duration: 30,
    style: '专业/深度解析',
    scenes: demoScenes,
  })

  const scenes = ref<StudioScene[]>([...demoScenes])
  const activeSceneId = ref('1')

  const activeScene = computed(
    () => scenes.value.find((s) => s.id === activeSceneId.value) ?? scenes.value[0],
  )

  function selectScene(id: string) {
    activeSceneId.value = id
  }

  function updateActiveScene(field: 'title' | 'duration' | 'voiceText' | 'visualPrompt', value: string | number) {
    const scene = scenes.value.find((s) => s.id === activeSceneId.value)
    if (!scene) return

    if (field === 'title') scene.title = String(value)
    if (field === 'duration') scene.duration = Number(value)
    if (field === 'voiceText') scene.voice = String(value)
    if (field === 'visualPrompt') scene.visual = String(value)
  }

  return {
    plan,
    scenes,
    activeSceneId,
    activeScene,
    selectScene,
    updateActiveScene,
  }
}
