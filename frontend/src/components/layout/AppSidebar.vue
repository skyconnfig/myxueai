<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  BarChart3,
  Clapperboard,
  FolderKanban,
  HardDrive,
  Layers,
  LayoutTemplate,
  Rocket,
  Settings,
} from 'lucide-vue-next'
import { useWorkspaceStore } from '@/stores/workspace'

const route = useRoute()
const router = useRouter()
const workspaceStore = useWorkspaceStore()

onMounted(() => {
  void workspaceStore.loadSummary()
})

interface NavItem {
  key: string
  label: string
  icon: typeof Clapperboard
  route: string
}

interface NavGroup {
  title: string
  items: NavItem[]
}

const navGroups: NavGroup[] = [
  {
    title: '创作',
    items: [
      { key: 'studio', label: 'AI Studio', icon: Clapperboard, route: 'create-video' },
      { key: 'dashboard', label: '项目中心', icon: FolderKanban, route: 'dashboard' },
    ],
  },
  {
    title: '内容资产',
    items: [
      { key: 'assets', label: '素材库', icon: Layers, route: 'assets' },
      { key: 'templates', label: '模板库', icon: LayoutTemplate, route: 'templates' },
    ],
  },
  {
    title: '增长',
    items: [
      { key: 'publish', label: '分发中心', icon: Rocket, route: 'dashboard' },
      { key: 'analytics', label: '生产统计', icon: BarChart3, route: 'dashboard' },
    ],
  },
  {
    title: '系统',
    items: [{ key: 'settings', label: '设置', icon: Settings, route: 'settings' }],
  },
]

const activeKey = computed(() => {
  const name = String(route.name)
  if (['video-plan', 'production', 'create-video'].includes(name)) return 'studio'
  if (name === 'dashboard') return 'dashboard'
  if (name === 'assets') return 'assets'
  if (name === 'templates') return 'templates'
  if (name === 'settings') return 'settings'
  return 'dashboard'
})

function navigate(item: NavItem) {
  router.push({ name: item.route })
}

function navClass(key: string) {
  return activeKey.value === key ? 'btn-nav btn-nav--active' : 'btn-nav'
}
</script>

<template>
  <aside class="w-56 bg-surface border-r border-border flex flex-col shrink-0 z-20">
    <div class="p-3 flex-1 overflow-y-auto">
      <div class="px-2 py-1.5 text-[10px] font-semibold text-muted/70 uppercase tracking-[0.14em]">
        Workspace
      </div>

      <div v-for="group in navGroups" :key="group.title" class="mt-3 first:mt-1">
        <div class="px-2 mb-1.5 text-base font-medium text-muted/60 tracking-wide">
          {{ group.title }}
        </div>
        <nav class="space-y-0.5">
          <button
            v-for="item in group.items"
            :key="item.key"
            type="button"
            :class="navClass(item.key)"
            @click="navigate(item)"
          >
            <component
              :is="item.icon"
              class="w-4 h-4 shrink-0"
              :class="activeKey === item.key ? 'text-accent-blue' : ''"
            />
            <span>{{ item.label }}</span>
          </button>
        </nav>
      </div>
    </div>

    <div class="p-3 border-t border-border">
      <div class="rounded-xl bg-dark/50 border border-border p-2.5">
        <div class="flex items-center justify-between text-[11px] mb-1.5">
          <span class="flex items-center gap-1.5 text-muted">
            <HardDrive class="w-3.5 h-3.5 text-accent-blue" />
            存储
          </span>
          <span class="font-mono text-muted">12%</span>
        </div>
        <div class="w-full bg-surface h-1 rounded-full overflow-hidden">
          <div class="bg-accent-blue h-full w-[12%]" />
        </div>
        <div class="mt-2 flex items-center justify-between text-[11px]">
          <span class="text-muted">AI 点数</span>
          <span class="text-accent-blue font-mono font-semibold">
            {{ workspaceStore.credits.toLocaleString() }}
          </span>
        </div>
      </div>
    </div>
  </aside>
</template>
