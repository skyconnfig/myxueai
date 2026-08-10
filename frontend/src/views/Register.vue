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

      <button type="submit" class="auth-form__submit btn-soft btn-soft--primary" :disabled="loading">
        <span>{{ loading ? '创建中...' : '创建账户' }}</span>
        <ArrowRight v-if="!loading" class="w-4 h-4" />
      </button>
    </form>
  </AuthShell>
</template>
