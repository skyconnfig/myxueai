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

      <button type="submit" class="auth-form__submit btn-soft btn-soft--primary" :disabled="loading">
        <span>{{ loading ? '登录中...' : '登录' }}</span>
        <ArrowRight v-if="!loading" class="w-4 h-4" />
      </button>

      <button type="button" class="auth-form__secondary" @click="fillDemo">
        使用演示账号
        <span class="auth-form__secondary-meta">demo@xueai.local</span>
      </button>
    </form>
  </AuthShell>
</template>
