export interface NavItem {
  key: string
  label: string
  subLabel?: string
  routeName?: string
}

export const workstationNav: NavItem[] = [
  { key: 'dashboard', label: 'Dashboard', subLabel: '项目中心', routeName: 'dashboard' },
  { key: 'projects', label: 'Projects', subLabel: '项目管理', routeName: 'dashboard' },
  { key: 'studio', label: 'Studio', subLabel: 'AI 生产中心', routeName: 'create-video' },
  { key: 'assets', label: 'Assets', subLabel: '素材资产库', routeName: 'assets' },
  { key: 'templates', label: 'Templates', subLabel: '视频模板', routeName: 'dashboard' },
  { key: 'publish', label: 'Publish', subLabel: '发布中心', routeName: 'dashboard' },
  { key: 'analytics', label: 'Analytics', subLabel: '生产统计', routeName: 'dashboard' },
  { key: 'settings', label: 'Settings', subLabel: '系统设置', routeName: 'settings' },
]

export const pipelineSteps = [
  { key: 'script', label: '文案生成' },
  { key: 'storyboard', label: '分镜编排' },
  { key: 'material', label: '素材对齐' },
  { key: 'render', label: '视频渲染' },
  { key: 'publish', label: '多端分发' },
] as const
