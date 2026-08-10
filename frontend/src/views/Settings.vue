<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useMessage } from 'naive-ui'
import { Key, LogOut, Palette, User } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
import { useWorkspaceStore } from '@/stores/workspace'
import { getStoredToken } from '@/api/auth'

const router = useRouter()
const message = useMessage()
const authStore = useAuthStore()
const workspaceStore = useWorkspaceStore()

const name = ref('')
const saving = ref(false)

const credits = computed(() => authStore.user?.credits ?? workspaceStore.credits)
const isLoggedIn = computed(() => authStore.isLoggedIn && !!getStoredToken())

onMounted(async () => {
  await authStore.init()
  void workspaceStore.loadSummary()
  name.value = authStore.user?.name ?? ''
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

function handleLogout() {
  authStore.logout()
  message.success('已退出登录')
  void router.push({ name: 'login' })
}
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

    <!-- 账户与资料 -->
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

    <!-- AI 接口（服务端 .env 配置） -->
    <section class="glass-panel p-5 space-y-3">
      <div class="flex items-start gap-3">
        <div class="w-9 h-9 rounded-lg bg-card border border-border flex items-center justify-center shrink-0">
          <Key :size="16" class="text-muted" />
        </div>
        <div>
          <h3 class="text-sm font-medium text-white m-0">AI 生产接口</h3>
          <p class="text-xs text-muted mt-0.5 mb-0">在 backend/.env 中配置，重启后端生效</p>
        </div>
      </div>
      <ul class="pl-12 space-y-2 text-xs text-muted m-0 list-none">
        <li><code class="text-accent-blue">OPENAI_API_KEY</code> — DALL·E 3 分镜配图</li>
        <li><code class="text-accent-blue">ELEVENLABS_API_KEY</code> — 多语言 TTS 配音</li>
        <li><code class="text-accent-blue">LLM_API_KEY</code> — AI 脚本生成（DeepSeek 等）</li>
      </ul>
    </section>

    <!-- Remotion 渲染 -->
    <section class="glass-panel p-5 space-y-3">
      <div class="flex items-start gap-3">
        <div class="w-9 h-9 rounded-lg bg-card border border-border flex items-center justify-center shrink-0">
          <Palette :size="16" class="text-accent-purple" />
        </div>
        <div>
          <h3 class="text-sm font-medium text-white m-0">Remotion MP4 渲染</h3>
          <p class="text-xs text-muted mt-0.5 mb-0">1920×1080 / 30fps，需先安装 Chromium</p>
        </div>
      </div>
      <div class="pl-12 text-xs text-muted space-y-1">
        <p class="m-0">首次渲染前在项目根目录执行：</p>
        <code class="block bg-dark border border-border rounded-lg px-3 py-2 text-[11px] text-white font-mono mt-2">
          pnpm remotion:browser
        </code>
      </div>
    </section>
  </div>
</template>
