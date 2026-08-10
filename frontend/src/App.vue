<script setup lang="ts">
import { darkTheme, NConfigProvider, NDialogProvider, NMessageProvider, dateZhCN, zhCN } from 'naive-ui'
import { themeOverrides } from '@/assets/styles/theme'
</script>

<template>
  <NConfigProvider
    :theme="darkTheme"
    :theme-overrides="themeOverrides"
    :locale="zhCN"
    :date-locale="dateZhCN"
  >
    <NMessageProvider>
      <NDialogProvider>
        <RouterView />
      </NDialogProvider>
    </NMessageProvider>
  </NConfigProvider>
</template>
