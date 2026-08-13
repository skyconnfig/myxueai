import { computed, ref, watch } from 'vue'

export type AppTheme = 'dark' | 'light'
export type AppLang = 'zh' | 'en'

const THEME_KEY = 'xueai:theme'
const LANG_KEY = 'xueai:lang'

const theme = ref<AppTheme>(loadTheme())
const lang = ref<AppLang>(loadLang())

const messages = {
  zh: {
    'app.name': 'XueAI 视频 OS',
    'nav.studio': 'AI 创作坊',
    'nav.dashboard': '项目控制中心',
    'nav.skills': '技能模组',
    'nav.assets': '云端资产',
    'nav.templates': '视频模板',
    'nav.settings': '系统设置',
    'nav.publish': '分发中心',
    'nav.analytics': '生产统计',
    'header.workspace': '当前工作区',
    'header.create': '新建视频',
    'header.tasks': '任务队列',
    'dash.title': '项目控制中心',
    'dash.subtitle': '管理、监控与导出 AI 导演视频工作流',
    'dash.search': '搜索项目...',
    'plan.active_skills': 'Active Skills',
    'plan.no_skills': '生成脚本后将显示 Agent 选用的 Skill 模组',
    'settings.theme': '界面主题',
    'settings.lang': '界面语言',
  },
  en: {
    'app.name': 'XueAI Video OS',
    'nav.studio': 'AI Studio',
    'nav.dashboard': 'Dashboard',
    'nav.skills': 'Skill Modules',
    'nav.assets': 'Cloud Assets',
    'nav.templates': 'Templates',
    'nav.settings': 'Settings',
    'nav.publish': 'Distribution',
    'nav.analytics': 'Analytics',
    'header.workspace': 'Workspace',
    'header.create': 'New Video',
    'header.tasks': 'Task Queue',
    'dash.title': 'Project Dashboard',
    'dash.subtitle': 'Manage, monitor and export AI director workflows',
    'dash.search': 'Search projects...',
    'plan.active_skills': 'Active Skills',
    'plan.no_skills': 'Skills appear here after Agent generates the storyboard',
    'settings.theme': 'Theme',
    'settings.lang': 'Language',
  },
} as const

type MessageKey = keyof typeof messages.zh

function loadTheme(): AppTheme {
  if (typeof window === 'undefined') return 'dark'
  const stored = window.localStorage.getItem(THEME_KEY)
  return stored === 'light' ? 'light' : 'dark'
}

function loadLang(): AppLang {
  if (typeof window === 'undefined') return 'zh'
  const stored = window.localStorage.getItem(LANG_KEY)
  return stored === 'en' ? 'en' : 'zh'
}

function applyTheme(value: AppTheme) {
  if (typeof document === 'undefined') return
  document.documentElement.dataset.theme = value
  document.documentElement.classList.toggle('light', value === 'light')
}

applyTheme(theme.value)

watch(theme, (value) => {
  window.localStorage.setItem(THEME_KEY, value)
  applyTheme(value)
})

watch(lang, (value) => {
  window.localStorage.setItem(LANG_KEY, value)
})

export function usePreferences() {
  const isDark = computed(() => theme.value === 'dark')

  function t(key: MessageKey) {
    return messages[lang.value][key] ?? messages.zh[key] ?? key
  }

  function toggleTheme() {
    theme.value = theme.value === 'dark' ? 'light' : 'dark'
  }

  function toggleLang() {
    lang.value = lang.value === 'zh' ? 'en' : 'zh'
  }

  function setTheme(value: AppTheme) {
    theme.value = value
  }

  function setLang(value: AppLang) {
    lang.value = value
  }

  return {
    theme,
    lang,
    isDark,
    t,
    toggleTheme,
    toggleLang,
    setTheme,
    setLang,
  }
}
