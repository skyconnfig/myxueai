export interface DemoScene {
  id: string
  index: number
  title: string
  description: string
  visual: string
  voice: string
  duration: number
  cameraAngle: string
  imageUrl: string
  audioUrl?: string
  voiceId?: string
  voiceEmotion?: string
  voiceoverActor: string
  transition: string
  bgmCategory: string
}

export interface DemoProject {
  id: string
  name: string
  category: string
  status: 'Ready' | 'Scripting' | 'Rendering' | 'Published' | 'DRAFT' | 'COMPLETED' | 'GENERATING'
  ratio: '9:16' | '16:9' | '1:1'
  duration: number
  updatedAt: string
  thumbnail: string
  views?: number
  scenes: DemoScene[]
}

export const DEMO_PROJECTS: DemoProject[] = [
  {
    id: 'demo-1',
    name: 'AI学习30天：从入门到自动化工作流',
    category: '科技干货',
    status: 'Ready',
    ratio: '9:16',
    duration: 60,
    updatedAt: '10分钟前',
    thumbnail: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
    views: 45200,
    scenes: [
      {
        id: 'scene-1',
        index: 1,
        title: '黄金3秒视觉钩子',
        description: '当大多数人还在讨论AI会不会取代人类时，头部创作者已经用AI自动化工厂，每天产出50条爆款视频。',
        visual: 'Cinematic dark studio camera angle focusing on futuristic digital video workspace canvas, 8k render',
        voice: '当大多数人还在讨论AI时，头部创作者已用AI工厂批量生产。',
        duration: 8,
        cameraAngle: '特写推镜头',
        imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
        voiceoverActor: '云希 (科技专业)',
        transition: 'Fade Up',
        bgmCategory: '科技脉冲',
      },
      {
        id: 'scene-2',
        index: 2,
        title: '行业痛点拆解',
        description: '传统的视频剪辑流程：写文案、找素材、对字幕、调色，一条1分钟视频可能要耗费整整4个小时。',
        visual: 'Minimalist dark slate studio workspace showing split view of traditional editing clutter',
        voice: '传统剪辑：写文案、找素材、配字幕，1分钟视频耗时4小时。',
        duration: 12,
        cameraAngle: '全景对比',
        imageUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=800&q=80',
        voiceoverActor: '云希 (科技专业)',
        transition: 'Zoom In',
        bgmCategory: '低沉悬念',
      },
      {
        id: 'scene-3',
        index: 3,
        title: '核心方案展示',
        description: '而真正的生产力工具，将文案、分镜、素材匹配与多轨时间轴流水线化。',
        visual: 'Sleek dark theme video editor interface with glowing audio waveforms and multi-track timeline',
        voice: '真正高效的操作系统：文案、分镜、素材与时间轴的全自动流水线。',
        duration: 15,
        cameraAngle: '平移俯瞰',
        imageUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=800&q=80',
        voiceoverActor: '云希 (科技专业)',
        transition: 'Cross Dissolve',
        bgmCategory: '节奏递进',
      },
      {
        id: 'scene-4',
        index: 4,
        title: '成果展示与数据证明',
        description: '从1条视频到多平台一键分发，生产效率提升10倍以上。',
        visual: 'Analytics multi-platform performance chart, clean high-contrast bar charts',
        voice: '生产效率提升10倍以上，实现内容的真正工业化量产。',
        duration: 15,
        cameraAngle: '中景拉近',
        imageUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80',
        voiceoverActor: '云希 (科技专业)',
        transition: 'Slide Right',
        bgmCategory: '高潮激昂',
      },
      {
        id: 'scene-5',
        index: 5,
        title: '号召行动与结尾',
        description: '关注 XueAI Video Factory，解锁专业级创作者的生产力操作系统。',
        visual: 'Minimalist brand frame mark, charcoal background, architectural lighting',
        voice: '关注 XueAI Video Factory，掌控专业级视频生产操作系统。',
        duration: 10,
        cameraAngle: '定格特写',
        imageUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
        voiceoverActor: '云希 (科技专业)',
        transition: 'Fade Up',
        bgmCategory: '优雅收尾',
      },
    ],
  },
  {
    id: 'demo-2',
    name: '2026科技新浪潮：具身智能与大模型融合',
    category: '前沿趋势',
    status: 'Scripting',
    ratio: '16:9',
    duration: 90,
    updatedAt: '2小时前',
    thumbnail: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=800&q=80',
    views: 12800,
    scenes: [
      {
        id: 'scene-201',
        index: 1,
        title: '前沿趋势引入',
        description: '2026年，大模型不再只待在云端服务器，具身智能正在重塑物理世界。',
        visual: 'Futuristic robotic arm integrated with neural glass sensors',
        voice: '2026年，具身智能正在重塑物理世界。',
        duration: 10,
        cameraAngle: '慢速特写',
        imageUrl: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=800&q=80',
        voiceoverActor: '云希 (科技专业)',
        transition: 'Fade Up',
        bgmCategory: '科技脉冲',
      },
    ],
  },
  {
    id: 'demo-3',
    name: '咖啡品牌 15 秒竖屏广告',
    category: '商业认知',
    status: 'Rendering',
    ratio: '9:16',
    duration: 15,
    updatedAt: '昨天',
    thumbnail: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=800&q=80',
    scenes: [
      {
        id: 'scene-301',
        index: 1,
        title: '品牌开场',
        description: '每一杯咖啡，都始于精选的咖啡豆。',
        visual: 'Warm coffee shop exterior, morning light, cinematic',
        voice: '每一杯咖啡，都始于精选的咖啡豆。',
        duration: 5,
        cameraAngle: '特写推镜头',
        imageUrl: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=800&q=80',
        voiceoverActor: '云希 (科技专业)',
        transition: 'Fade Up',
        bgmCategory: '优雅收尾',
      },
    ],
  },
]

export const DEMO_ASSETS = [
  {
    id: 'ast-1',
    title: 'Dark Tech Studio Frame',
    type: 'IMAGE' as const,
    tag: 'Tech',
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
    fileSize: '2.4 MB',
  },
  {
    id: 'ast-2',
    title: 'Editing Suite B-Roll',
    type: 'IMAGE' as const,
    tag: 'Office',
    url: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=800&q=80',
    fileSize: '1.8 MB',
  },
  {
    id: 'ast-3',
    title: 'Synth Beat 120BPM',
    type: 'AUDIO' as const,
    tag: 'Cyber',
    url: '',
    fileSize: '4.2 MB',
  },
]
