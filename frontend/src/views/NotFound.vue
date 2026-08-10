<script setup lang="ts">
import { useRouter } from 'vue-router'
import { NButton, NResult } from 'naive-ui'

const router = useRouter()
</script>

<template>
  <div class="min-h-[60vh] flex items-center justify-center">
    <NResult status="404" title="页面不存在" description="请检查链接是否正确">
      <template #footer>
        <NButton type="primary" @click="router.push({ name: 'dashboard' })">
          返回首页
        </NButton>
      </template>
    </NResult>
  </div>
</template>
