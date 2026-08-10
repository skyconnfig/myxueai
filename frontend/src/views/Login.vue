<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMessage } from 'naive-ui'
import { ArrowRight } from 'lucide-vue-next'
import AuthField from '@/components/auth/AuthField.vue'
import AuthShell from '@/components/auth/AuthShell.vue'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const router = useRouter()
const message = useMessage()
const authStore = useAuthStore()

const email = ref('demo@xueai.local')
const password = ref('demo123456')
const loading = ref(false)

async function handleSubmit() {
  loading.value = true
  try {
    await authStore.login(email.value, password.value)
    message.success('登录成功')
    const redirect = (route.query.redirect as string) || '/'
    await router.replace(redirect)
  } catch (err) {
    message.error(err instanceof Error ? err.message : '登录失败')
  } finally {
    loading.value = false
  }
}

function fillDemo() {
  email.value = 'demo@xueai.local'
  password.value = 'demo123456'
}
</script>

<template>
  <AuthShell mode="login">
    <form class="auth-form" @submit.prevent="handleSubmit">
      <div class="auth-form__fields">
        <AuthField
          v-model="email"
          label="邮箱"
          type="email"
          required
          autocomplete="email"
          placeholder="you@example.com"
        />
        <AuthField
          v-model="password"
          label="密码"
          type="password"
          required
          minlength="6"
          autocomplete="current-password"
          placeholder="至少 6 位"
        />
      </div>

      <button type="submit" class="auth-form__submit" :disabled="loading">
        <span>{{ loading ? '登录中...' : '登录' }}</span>
        <ArrowRight v-if="!loading" class="w-4 h-4" />
      </button>

      <button type="button" class="auth-form__demo" @click="fillDemo">
        使用演示账号
        <span class="auth-form__demo-meta">demo@xueai.local</span>
      </button>
    </form>
  </AuthShell>
</template>

<style scoped>
.auth-form__fields {
  display: flex;
  flex-direction: column;
  gap: 1.125rem;
}

.auth-form__submit {
  width: 100%;
  height: 2.75rem;
  margin-top: 1.5rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-primary);
  background: var(--bg-card);
  border: 1px solid rgba(59, 130, 246, 0.5);
  border-radius: 10px;
  cursor: pointer;
  transition:
    background-color 0.15s ease,
    border-color 0.15s ease,
    color 0.15s ease,
    transform 0.15s ease;
}

.auth-form__submit:hover:not(:disabled) {
  background: rgba(59, 130, 246, 0.14);
  border-color: var(--accent-blue);
  color: var(--accent-blue);
}

.auth-form__submit:active:not(:disabled) {
  transform: scale(0.99);
}

.auth-form__submit:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.auth-form__submit:focus-visible {
  outline: 2px solid var(--accent-blue);
  outline-offset: 2px;
}

.auth-form__demo {
  width: 100%;
  margin-top: 0.75rem;
  padding: 0.65rem 0.75rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.15rem;
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--text-muted);
  background: transparent;
  border: 1px dashed var(--border-color);
  border-radius: 10px;
  cursor: pointer;
  transition: border-color 0.15s ease, color 0.15s ease, background-color 0.15s ease;
}

.auth-form__demo:hover {
  border-color: rgba(59, 130, 246, 0.45);
  color: var(--text-primary);
  background: rgba(59, 130, 246, 0.06);
}

.auth-form__demo-meta {
  font-family: ui-monospace, monospace;
  font-size: 0.65rem;
  opacity: 0.85;
}
</style>
