<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useMessage } from 'naive-ui'
import {
  CheckCircle2,
  Key,
  Loader2,
  LogOut,
  Moon,
  Palette,
  RefreshCw,
  Sun,
  User,
  XCircle,
} from 'lucide-vue-next'
import {
  ensureRemotionBrowser,
  fetchAiProductionSettings,
  fetchRemotionSettings,
  refreshRemotionBrowser,
  updateAiProductionSettings,
  updateRemotionSettings,
  type AiProductionSettingsPublic,
  type RemotionSettingsPublic,
} from '@/api/settings'
import { usePreferences, type AppLang, type AppTheme } from '@/composables/usePreferences'
import { useAuthStore } from '@/stores/auth'
import { useWorkspaceStore } from '@/stores/workspace'
import { getStoredToken } from '@/api/auth'

const router = useRouter()
const message = useMessage()
const authStore = useAuthStore()
const workspaceStore = useWorkspaceStore()
const { theme, lang, t, setTheme, setLang } = usePreferences()

const name = ref('')
const saving = ref(false)
const aiLoading = ref(false)
const aiSaving = ref(false)
const aiSettings = ref<AiProductionSettingsPublic | null>(null)

const remotionLoading = ref(false)
const remotionSaving = ref(false)
const remotionSettings = ref<RemotionSettingsPublic | null>(null)
const remotionForm = ref({
  width: 1920,
  height: 1080,
  fps: 30,
  crf: 18,
  concurrency: 1,
  chromiumHeadless: true,
})
let remotionPollTimer: number | undefined

const aiForm = ref({
  llmApiKey: '',
  llmBaseUrl: '',
  llmModel: '',
  imageApiKey: '',
  imageBaseUrl: '',
  imageModel: '',
  ttsApiKey: '',
  ttsBaseUrl: '',
  ttsModel: '',
  ttsVoice: '',
  elevenLabsApiKey: '',
  elevenLabsVoiceId: '',
  bgmDefaultUrl: '',
})

const credits = computed(() => authStore.user?.credits ?? workspaceStore.credits)
const isLoggedIn = computed(() => authStore.isLoggedIn && !!getStoredToken())

function fillFormFromSettings(data: AiProductionSettingsPublic) {
  aiForm.value = {
    llmApiKey: '',
    llmBaseUrl: data.llm.baseUrl,
    llmModel: data.llm.model,
    imageApiKey: '',
    imageBaseUrl: data.image.baseUrl,
    imageModel: data.image.model,
    ttsApiKey: '',
    ttsBaseUrl: data.tts.baseUrl,
    ttsModel: data.tts.model,
    ttsVoice: data.tts.voice,
    elevenLabsApiKey: '',
    elevenLabsVoiceId: data.elevenLabs.voiceId,
    bgmDefaultUrl: data.bgm.defaultUrl,
  }
}

async function loadAiSettings() {
  if (!isLoggedIn.value) return
  aiLoading.value = true
  try {
    const data = await fetchAiProductionSettings()
    aiSettings.value = data
    fillFormFromSettings(data)
  } catch (err) {
    message.error(err instanceof Error ? err.message : '加载 AI 配置失败')
  } finally {
    aiLoading.value = false
  }
}

function fillRemotionForm(data: RemotionSettingsPublic) {
  remotionForm.value = {
    width: data.width,
    height: data.height,
    fps: data.fps,
    crf: data.crf,
    concurrency: data.concurrency,
    chromiumHeadless: data.chromiumHeadless,
  }
}

function stopRemotionPoll() {
  if (remotionPollTimer) {
    window.clearInterval(remotionPollTimer)
    remotionPollTimer = undefined
  }
}

function startRemotionPoll() {
  stopRemotionPoll()
  remotionPollTimer = window.setInterval(async () => {
    if (!isLoggedIn.value) return
    try {
      const data = await fetchRemotionSettings()
      remotionSettings.value = data
      fillRemotionForm(data)
      if (data.browser.status === 'ready' || data.browser.status === 'failed') {
        stopRemotionPoll()
        if (data.browser.status === 'ready') {
          message.success('Remotion Chromium 已就绪')
        }
      }
    } catch {
      stopRemotionPoll()
    }
  }, 3000)
}

async function loadRemotionSettings(autoSetup = true) {
  if (!isLoggedIn.value) return
  remotionLoading.value = true
  try {
    let data = await fetchRemotionSettings()
    remotionSettings.value = data
    fillRemotionForm(data)

    if (
      autoSetup &&
      (data.browser.status === 'missing' ||
        data.browser.status === 'unknown' ||
        data.browser.status === 'failed')
    ) {
      data = await ensureRemotionBrowser()
      remotionSettings.value = data
      fillRemotionForm(data)
      startRemotionPoll()
    } else if (data.browser.status === 'installing' || data.browser.status === 'checking') {
      startRemotionPoll()
    }
  } catch (err) {
    message.error(err instanceof Error ? err.message : '加载 Remotion 配置失败')
  } finally {
    remotionLoading.value = false
  }
}

async function handleEnsureRemotionBrowser() {
  if (!isLoggedIn.value) return
  try {
    remotionSettings.value = await ensureRemotionBrowser()
    startRemotionPoll()
    message.info('正在配置 Chromium...')
  } catch (err) {
    message.error(err instanceof Error ? err.message : '启动 Chromium 配置失败')
  }
}

async function handleRefreshRemotionStatus() {
  if (!isLoggedIn.value) return
  try {
    remotionSettings.value = await refreshRemotionBrowser()
    fillRemotionForm(remotionSettings.value)
  } catch (err) {
    message.error(err instanceof Error ? err.message : '刷新状态失败')
  }
}

async function saveRemotionSettings() {
  if (!isLoggedIn.value) return
  remotionSaving.value = true
  try {
    remotionSettings.value = await updateRemotionSettings({ ...remotionForm.value })
    message.success('Remotion 渲染参数已保存')
  } catch (err) {
    message.error(err instanceof Error ? err.message : '保存 Remotion 配置失败')
  } finally {
    remotionSaving.value = false
  }
}

onMounted(async () => {
  await authStore.init()
  void workspaceStore.loadSummary()
  name.value = authStore.user?.name ?? ''
  await Promise.all([loadAiSettings(), loadRemotionSettings(true)])
})

onUnmounted(() => {
  stopRemotionPoll()
})

async function saveProfile() {
  if (!authStore.isLoggedIn) {
    message.warning('请先登录后再编辑资料')
    await router.push({ name: 'login', query: { redirect: '/settings' } })
    return
  }
  saving.value = true
  try {
    await authStore.updateProfile({ name: name.value.trim() })
    message.success('个人资料已保存')
  } catch (err) {
    message.error(err instanceof Error ? err.message : '保存失败')
  } finally {
    saving.value = false
  }
}

async function saveAiSettings() {
  if (!isLoggedIn.value) {
    message.warning('请先登录后再配置 AI 接口')
    await router.push({ name: 'login', query: { redirect: '/settings' } })
    return
  }
  aiSaving.value = true
  try {
    const payload = Object.fromEntries(
      Object.entries(aiForm.value).filter(([, value]) => value.trim() !== ''),
    )
    aiSettings.value = await updateAiProductionSettings(payload)
    fillFormFromSettings(aiSettings.value)
    message.success('AI 生产接口已保存，立即生效')
  } catch (err) {
    message.error(err instanceof Error ? err.message : '保存 AI 配置失败')
  } finally {
    aiSaving.value = false
  }
}

function handleLogout() {
  authStore.logout()
  message.success('已退出登录')
  void router.push({ name: 'login' })
}

function statusBadge(configured: boolean) {
  return configured
    ? { icon: CheckCircle2, class: 'text-success', label: '已配置' }
    : { icon: XCircle, class: 'text-warning', label: '未配置' }
}

const remotionBrowserBadge = computed(() => {
  const status = remotionSettings.value?.browser.status ?? 'unknown'
  const map: Record<string, { icon: typeof CheckCircle2; class: string; label: string }> = {
    ready: { icon: CheckCircle2, class: 'text-success', label: '已就绪' },
    installing: { icon: Loader2, class: 'text-accent-blue animate-spin', label: '配置中' },
    checking: { icon: Loader2, class: 'text-accent-blue animate-spin', label: '检测中' },
    missing: { icon: XCircle, class: 'text-warning', label: '未安装' },
    failed: { icon: XCircle, class: 'text-danger', label: '失败' },
    unknown: { icon: XCircle, class: 'text-muted', label: '未知' },
  }
  return map[status] ?? map.unknown
})
</script>

<template>
  <div class="max-w-2xl mx-auto p-6 space-y-8">
    <div>
      <div class="text-[10px] font-semibold uppercase tracking-widest text-accent-blue mb-1">
        System Settings
      </div>
      <h1 class="text-2xl font-semibold text-white m-0">系统设置</h1>
      <p class="text-sm text-muted mt-1 mb-0">管理账户、AI 接口与生产偏好</p>
    </div>

    <section class="glass-panel p-5 space-y-4">
      <div class="flex items-start gap-3">
        <div class="w-9 h-9 rounded-lg bg-card border border-border flex items-center justify-center shrink-0">
          <User :size="16" class="text-accent-blue" />
        </div>
        <div class="flex-1 min-w-0">
          <h3 class="text-sm font-medium text-white m-0">账户与资料</h3>
          <p class="text-xs text-muted mt-0.5 mb-0">
            {{ isLoggedIn ? authStore.user?.email : '当前为访客模式（Demo 用户）' }}
          </p>
        </div>
        <span
          v-if="isLoggedIn"
          class="text-[10px] font-mono px-2 py-0.5 rounded-lg bg-accent-blue/10 text-accent-blue border border-accent-blue/30"
        >
          已登录
        </span>
      </div>

      <div class="space-y-3 pl-12">
        <div class="space-y-1.5">
          <label class="text-xs text-muted">昵称</label>
          <input
            v-model="name"
            type="text"
            class="w-full h-9 px-3 bg-dark border border-border rounded-lg text-sm text-white focus:outline-none focus:border-accent-blue"
            placeholder="你的显示名称"
            :disabled="!isLoggedIn"
          />
        </div>
        <div class="flex items-center justify-between text-xs text-muted font-mono">
          <span>AI 点数余额</span>
          <span class="text-white font-semibold">{{ credits.toLocaleString() }}</span>
        </div>
        <div class="flex gap-2 pt-1">
          <button
            class="btn-soft !h-9 !px-4 !text-xs"
            :disabled="saving || !isLoggedIn"
            @click="saveProfile"
          >
            {{ saving ? '保存中...' : '保存资料' }}
          </button>
          <button
            v-if="isLoggedIn"
            class="btn-soft !h-9 !px-4 !text-xs !text-danger hover:!border-danger/40"
            @click="handleLogout"
          >
            <LogOut class="w-3.5 h-3.5 inline mr-1" />
            退出登录
          </button>
          <button
            v-else
            class="btn-soft btn-soft--primary !h-9 !px-4 !text-xs"
            @click="router.push({ name: 'login', query: { redirect: '/settings' } })"
          >
            去登录
          </button>
        </div>
      </div>
    </section>

    <section class="glass-panel p-5 space-y-4">
      <div class="flex items-start gap-3">
        <div class="w-9 h-9 rounded-lg bg-card border border-border flex items-center justify-center shrink-0">
          <Key :size="16" class="text-accent-blue" />
        </div>
        <div class="flex-1">
          <h3 class="text-sm font-medium text-white m-0">AI 生产接口</h3>
          <p class="text-xs text-muted mt-0.5 mb-0">
            在前端保存后立即生效，无需重启后端。密钥留空表示不修改已有值。
          </p>
          <p v-if="aiSettings?.updatedAt" class="text-[10px] text-muted font-mono mt-1 mb-0">
            上次保存：{{ new Date(aiSettings.updatedAt).toLocaleString() }}
            · 来源：{{ aiSettings.source === 'runtime' ? '前端配置' : '环境变量' }}
          </p>
        </div>
      </div>

      <div v-if="!isLoggedIn" class="pl-12 text-xs text-muted">
        登录后可在此配置 LLM、配图、配音与 BGM。
      </div>

      <div v-else-if="aiLoading" class="pl-12 text-xs text-muted">加载配置中...</div>

      <div v-else class="pl-12 space-y-5">
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <h4 class="text-xs font-semibold text-white m-0">LLM 脚本生成</h4>
            <span
              v-if="aiSettings"
              class="text-[10px] font-mono flex items-center gap-1"
              :class="statusBadge(aiSettings.llm.configured).class"
            >
              <component :is="statusBadge(aiSettings.llm.configured).icon" class="w-3 h-3" />
              {{ statusBadge(aiSettings.llm.configured).label }}
              <span v-if="aiSettings.llm.apiKey.masked" class="text-muted ml-1">{{ aiSettings.llm.apiKey.masked }}</span>
            </span>
          </div>
          <input v-model="aiForm.llmApiKey" type="password" placeholder="LLM API Key（留空不修改）" class="field-input" />
          <input v-model="aiForm.llmBaseUrl" type="url" placeholder="Base URL" class="field-input" />
          <input v-model="aiForm.llmModel" type="text" placeholder="Model，如 deepseek-v4-flash" class="field-input" />
        </div>

        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <h4 class="text-xs font-semibold text-white m-0">分镜配图 (DALL·E / GPT Image)</h4>
            <span
              v-if="aiSettings"
              class="text-[10px] font-mono flex items-center gap-1"
              :class="statusBadge(aiSettings.image.configured).class"
            >
              <component :is="statusBadge(aiSettings.image.configured).icon" class="w-3 h-3" />
              {{ statusBadge(aiSettings.image.configured).label }}
            </span>
          </div>
          <input v-model="aiForm.imageApiKey" type="password" placeholder="Image API Key（留空不修改）" class="field-input" />
          <input v-model="aiForm.imageBaseUrl" type="url" placeholder="Image Base URL" class="field-input" />
          <input v-model="aiForm.imageModel" type="text" placeholder="Image Model，如 dall-e-3" class="field-input" />
        </div>

        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <h4 class="text-xs font-semibold text-white m-0">网关配音 (TTS)</h4>
            <span
              v-if="aiSettings"
              class="text-[10px] font-mono flex items-center gap-1"
              :class="statusBadge(aiSettings.tts.configured).class"
            >
              <component :is="statusBadge(aiSettings.tts.configured).icon" class="w-3 h-3" />
              {{ statusBadge(aiSettings.tts.configured).label }}
            </span>
          </div>
          <input v-model="aiForm.ttsApiKey" type="password" placeholder="TTS_API_KEY（留空不修改）" class="field-input" />
          <input v-model="aiForm.ttsBaseUrl" type="url" placeholder="TTS Base URL" class="field-input" />
          <div class="grid grid-cols-2 gap-2">
            <input v-model="aiForm.ttsModel" type="text" placeholder="TTS Model" class="field-input" />
            <input v-model="aiForm.ttsVoice" type="text" placeholder="Voice ID" class="field-input" />
          </div>
        </div>

        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <h4 class="text-xs font-semibold text-white m-0">ElevenLabs（可选，优先于网关）</h4>
            <span
              v-if="aiSettings"
              class="text-[10px] font-mono flex items-center gap-1"
              :class="statusBadge(aiSettings.elevenLabs.configured).class"
            >
              <component :is="statusBadge(aiSettings.elevenLabs.configured).icon" class="w-3 h-3" />
              {{ statusBadge(aiSettings.elevenLabs.configured).label }}
            </span>
          </div>
          <input v-model="aiForm.elevenLabsApiKey" type="password" placeholder="ElevenLabs API Key" class="field-input" />
          <input v-model="aiForm.elevenLabsVoiceId" type="text" placeholder="Voice ID" class="field-input" />
        </div>

        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <h4 class="text-xs font-semibold text-white m-0">背景音乐 BGM</h4>
            <span
              v-if="aiSettings"
              class="text-[10px] font-mono flex items-center gap-1"
              :class="statusBadge(aiSettings.bgm.configured).class"
            >
              <component :is="statusBadge(aiSettings.bgm.configured).icon" class="w-3 h-3" />
              {{ statusBadge(aiSettings.bgm.configured).label }}
            </span>
          </div>
          <input v-model="aiForm.bgmDefaultUrl" type="url" placeholder="默认 BGM MP3 URL" class="field-input" />
        </div>

        <button
          class="btn-soft btn-soft--primary !h-9 !px-4 !text-xs"
          :disabled="aiSaving"
          @click="saveAiSettings"
        >
          {{ aiSaving ? '保存中...' : '保存 AI 配置' }}
        </button>
      </div>
    </section>

    <section class="glass-panel p-5 space-y-4">
      <div class="flex items-start gap-3">
        <div class="w-9 h-9 rounded-lg bg-card border border-border flex items-center justify-center shrink-0">
          <Sun v-if="theme === 'dark'" :size="16" class="text-accent-blue" />
          <Moon v-else :size="16" class="text-accent-blue" />
        </div>
        <div>
          <h3 class="text-sm font-medium text-white m-0">{{ t('settings.theme') }} / {{ t('settings.lang') }}</h3>
          <p class="text-xs text-muted mt-0.5 mb-0">与原型一致的浅色/深色与双语切换</p>
        </div>
      </div>
      <div class="pl-12 grid sm:grid-cols-2 gap-4">
        <div class="space-y-2">
          <label class="text-xs text-muted">{{ t('settings.theme') }}</label>
          <div class="flex gap-2">
            <button
              v-for="opt in (['dark', 'light'] as AppTheme[])"
              :key="opt"
              type="button"
              class="flex-1 py-2 rounded-lg border text-xs capitalize transition"
              :class="theme === opt ? 'border-accent-blue bg-accent-blue/10 text-accent-blue' : 'border-border text-muted'"
              @click="setTheme(opt)"
            >
              {{ opt }}
            </button>
          </div>
        </div>
        <div class="space-y-2">
          <label class="text-xs text-muted">{{ t('settings.lang') }}</label>
          <div class="flex gap-2">
            <button
              v-for="opt in (['zh', 'en'] as AppLang[])"
              :key="opt"
              type="button"
              class="flex-1 py-2 rounded-lg border text-xs uppercase transition"
              :class="lang === opt ? 'border-accent-blue bg-accent-blue/10 text-accent-blue' : 'border-border text-muted'"
              @click="setLang(opt)"
            >
              {{ opt }}
            </button>
          </div>
        </div>
      </div>
    </section>

    <section class="glass-panel p-5 space-y-4">
      <div class="flex items-start gap-3">
        <div class="w-9 h-9 rounded-lg bg-card border border-border flex items-center justify-center shrink-0">
          <Palette :size="16" class="text-accent-purple" />
        </div>
        <div class="flex-1">
          <div class="flex items-center justify-between gap-2">
            <h3 class="text-sm font-medium text-white m-0">Remotion MP4 渲染</h3>
            <span
              v-if="remotionSettings"
              class="text-[10px] font-mono flex items-center gap-1 shrink-0"
              :class="remotionBrowserBadge.class"
            >
              <component :is="remotionBrowserBadge.icon" class="w-3 h-3" />
              {{ remotionBrowserBadge.label }}
            </span>
          </div>
          <p class="text-xs text-muted mt-0.5 mb-0">
            页面内配置分辨率与 Chromium，进入设置页会自动检测并安装浏览器内核
          </p>
          <p v-if="remotionSettings?.browser.message" class="text-[11px] text-muted mt-1 mb-0">
            {{ remotionSettings.browser.message }}
          </p>
        </div>
      </div>

      <div v-if="!isLoggedIn" class="pl-12 text-xs text-muted">登录后可配置 Remotion 渲染引擎。</div>
      <div v-else-if="remotionLoading" class="pl-12 text-xs text-muted flex items-center gap-2">
        <Loader2 class="w-3.5 h-3.5 animate-spin" />
        正在加载渲染配置...
      </div>
      <div v-else class="pl-12 space-y-4">
        <div class="grid grid-cols-3 gap-2">
          <div class="space-y-1">
            <label class="text-[10px] text-muted">宽度</label>
            <input v-model.number="remotionForm.width" type="number" class="field-input" />
          </div>
          <div class="space-y-1">
            <label class="text-[10px] text-muted">高度</label>
            <input v-model.number="remotionForm.height" type="number" class="field-input" />
          </div>
          <div class="space-y-1">
            <label class="text-[10px] text-muted">FPS</label>
            <input v-model.number="remotionForm.fps" type="number" class="field-input" />
          </div>
        </div>

        <div class="grid grid-cols-2 gap-2">
          <div class="space-y-1">
            <label class="text-[10px] text-muted">CRF 质量 (0-51)</label>
            <input v-model.number="remotionForm.crf" type="number" min="0" max="51" class="field-input" />
          </div>
          <div class="space-y-1">
            <label class="text-[10px] text-muted">并发</label>
            <input v-model.number="remotionForm.concurrency" type="number" min="1" max="8" class="field-input" />
          </div>
        </div>

        <label class="flex items-center gap-2 text-xs text-muted cursor-pointer">
          <input v-model="remotionForm.chromiumHeadless" type="checkbox" class="accent-accent-blue" />
          Headless Chromium（推荐开启）
        </label>

        <div class="flex flex-wrap gap-2">
          <button
            type="button"
            class="btn-soft btn-soft--primary !h-9 !px-4 !text-xs"
            :disabled="remotionSaving"
            @click="saveRemotionSettings"
          >
            {{ remotionSaving ? '保存中...' : '保存渲染参数' }}
          </button>
          <button
            type="button"
            class="btn-soft !h-9 !px-4 !text-xs"
            @click="handleEnsureRemotionBrowser"
          >
            重新配置 Chromium
          </button>
          <button
            type="button"
            class="btn-soft !h-9 !px-3 !text-xs"
            @click="handleRefreshRemotionStatus"
          >
            <RefreshCw class="w-3.5 h-3.5 inline" />
            刷新状态
          </button>
        </div>

        <div class="text-[10px] text-muted font-mono space-y-1">
          <div>渲染脚本：{{ remotionSettings?.renderScriptReady ? '就绪' : '缺失' }}</div>
          <div>Remotion 包：{{ remotionSettings?.remotionPackageReady ? '就绪' : '缺失' }}</div>
          <div v-if="remotionSettings?.updatedAt">参数更新：{{ new Date(remotionSettings.updatedAt).toLocaleString() }}</div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.field-input {
  width: 100%;
  height: 2.25rem;
  padding: 0 0.75rem;
  background: var(--bg-dark);
  border: 1px solid var(--border-color);
  border-radius: 0.5rem;
  font-size: 0.875rem;
  color: var(--text-primary);
}
.field-input:focus {
  outline: none;
  border-color: var(--accent-blue);
}
</style>
