<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useMessage } from 'naive-ui'
import { ArrowRight } from 'lucide-vue-next'
import AuthField from '@/components/auth/AuthField.vue'
import AuthShell from '@/components/auth/AuthShell.vue'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const message = useMessage()
const authStore = useAuthStore()

const name = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const loading = ref(false)

async function handleSubmit() {
  if (password.value !== confirmPassword.value) {
    message.warning('两次输入的密码不一致')
    return
  }
  if (password.value.length < 6) {
    message.warning('密码至少 6 位')
    return
  }

  loading.value = true
  try {
    await authStore.register(email.value, password.value, name.value || undefined)
    message.success('注册成功，欢迎加入 XueAI')
    await router.replace('/')
  } catch (err) {
    message.error(err instanceof Error ? err.message : '注册失败')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <AuthShell mode="register">
    <form class="auth-form" @submit.prevent="handleSubmit">
      <div class="auth-form__fields">
        <AuthField
          v-model="name"
          label="昵称"
          autocomplete="name"
          placeholder="如何称呼你（可选）"
        />
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
          autocomplete="new-password"
          placeholder="至少 6 位"
        />
        <AuthField
          v-model="confirmPassword"
          label="确认密码"
          type="password"
          required
          minlength="6"
          autocomplete="new-password"
          placeholder="再次输入密码"
        />
      </div>

      <p class="auth-form__hint">
        注册即表示你同意使用 XueAI 进行 AI 辅助视频创作，并获得初始 AI 点数。
      </p>

      <button type="submit" class="auth-form__submit" :disabled="loading">
        <span>{{ loading ? '创建中...' : '创建账户' }}</span>
        <ArrowRight v-if="!loading" class="w-4 h-4" />
      </button>
    </form>
  </AuthShell>
</template>

<style scoped>
.auth-form__fields {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.auth-form__hint {
  margin: 1rem 0 0;
  font-size: 0.6875rem;
  line-height: 1.55;
  color: var(--text-muted);
}

.auth-form__submit {
  width: 100%;
  height: 2.75rem;
  margin-top: 1.25rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: #fff;
  background: var(--accent-gradient);
  border: none;
  border-radius: 10px;
  cursor: pointer;
  transition: opacity 0.15s ease, transform 0.15s ease, box-shadow 0.15s ease;
  box-shadow: 0 4px 20px rgba(59, 130, 246, 0.25);
}

.auth-form__submit:hover:not(:disabled) {
  opacity: 0.92;
  box-shadow: 0 6px 28px rgba(59, 130, 246, 0.35);
}

.auth-form__submit:active:not(:disabled) {
  transform: scale(0.99);
}

.auth-form__submit:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.auth-form__submit:focus-visible {
  outline: 2px solid var(--accent-purple);
  outline-offset: 2px;
}
</style>
