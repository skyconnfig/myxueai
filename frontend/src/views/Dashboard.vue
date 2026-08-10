<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  ArrowRight,
  Clock,
  FolderKanban,
  Layers,
  Play,
  Plus,
  Rocket,
  Sparkles,
  TrendingUp,
  Video,
  Wand2,
} from 'lucide-vue-next'
import { useProjectStore } from '@/stores/project'
import { useWorkspaceStore } from '@/stores/workspace'

const router = useRouter()
const projectStore = useProjectStore()
const workspaceStore = useWorkspaceStore()

onMounted(async () => {
  await Promise.all([projectStore.loadProjects(), workspaceStore.loadTemplates(), workspaceStore.loadSummary()])
})

const displayProjects = computed(() =>
  projectStore.projects.map((p) => ({
    id: p.id,
    name: p.name,
    category: p.style ?? '未分类',
    status: p.status,
    ratio: p.ratio,
    duration: p.duration,
    updatedAt: new Date(p.updatedAt).toLocaleDateString(),
    thumbnail: p.thumbnail ?? '',
    sceneCount: p.sceneCount ?? 0,
  })),
)

const dashboardStats = computed(() => [
  {
    label: '剩余 AI 点数',
    value: workspaceStore.credits.toLocaleString(),
    unit: '',
    trend: '脚本生成 ~120/次',
    icon: Sparkles,
    color: 'text-accent-purple',
  },
  {
    label: '进行中任务',
    value: String(workspaceStore.runningCount),
    unit: '个',
    trend: `队列 ${workspaceStore.queueCount} 个`,
    icon: Rocket,
    color: 'text-accent-blue',
  },
  {
    label: '平均单条用时',
    value: workspaceStore.avgProductionMinutes != null ? String(workspaceStore.avgProductionMinutes) : '—',
    unit: workspaceStore.avgProductionMinutes != null ? '分钟' : '',
    trend:
      workspaceStore.completedProjectCount > 0
        ? `已完成 ${workspaceStore.completedProjectCount} 个项目`
        : '完成首个项目后显示',
    icon: Clock,
    color: 'text-warning',
  },
  {
    label: '资产库索引',
    value: workspaceStore.assetCount.toLocaleString(),
    unit: '个',
    trend: '高清素材与音频',
    icon: Layers,
    color: 'text-accent-purple',
  },
])

function openStudio(id?: string) {
  if (!id) {
    router.push({ name: 'create-video' })
    return
  }
  router.push({ name: 'video-plan', params: { id } })
}

function statusLabel(status: string) {
  const map: Record<string, { text: string; class: string }> = {
    PLANNING: { text: '分镜中', class: 'bg-accent-blue/10 border-accent-blue/30 text-accent-blue' },
    COMPLETED: { text: '已就绪', class: 'bg-success/10 border-success/30 text-success' },
    GENERATING: { text: '生成中', class: 'bg-warning/10 border-warning/30 text-warning' },
    RENDERING: { text: '渲染中', class: 'bg-warning/10 border-warning/30 text-warning' },
    DRAFT: { text: '草稿', class: 'bg-card border-border text-muted' },
    Ready: { text: '已就绪', class: 'bg-success/10 border-success/30 text-success' },
  }
  return map[status] ?? map.DRAFT
}
</script>

<template>
  <div class="p-6 space-y-6 max-w-7xl mx-auto">
    <div class="glass-panel p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
      <div class="space-y-2">
        <div class="flex items-center gap-2">
          <span class="px-2 py-0.5 bg-accent-blue/10 border border-accent-blue/30 text-accent-blue text-[11px] font-mono rounded-full">
            AI 视频生产操作系统
          </span>
        </div>
        <h1 class="text-xl font-bold text-white m-0">欢迎回来，从想法到成片只需一步</h1>
        <p class="text-sm text-muted max-w-2xl m-0">
          灵感 → AI 脚本 → 自动分镜 → 素材生成 → 自动剪辑 → 多端发布
        </p>
      </div>
      <div class="flex items-center gap-3 shrink-0">
        <button
          type="button"
          class="btn-soft"
          @click="openStudio(displayProjects[0]?.id)"
        >
          <Video class="w-4 h-4 text-accent-blue" />
          进入 Studio
        </button>
        <button
          type="button"
          class="btn-soft btn-soft--primary"
          @click="router.push({ name: 'create-video' })"
        >
          <Plus class="w-4 h-4 text-accent-blue" />
          AI 创建视频
        </button>
      </div>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div
        v-for="(stat, i) in dashboardStats"
        :key="i"
        class="glass-panel p-4 flex items-center justify-between"
      >
        <div>
          <div class="text-xs text-muted font-medium">{{ stat.label }}</div>
          <div class="text-2xl font-black text-white mt-1 font-mono">
            {{ stat.value }}
            <span v-if="stat.unit" class="text-xs text-muted font-normal">{{ stat.unit }}</span>
          </div>
          <div class="text-[11px] text-success flex items-center gap-1 mt-1 font-mono">
            <TrendingUp v-if="i < 2" class="w-3 h-3" />
            <span>{{ stat.trend }}</span>
          </div>
        </div>
        <div class="w-10 h-10 bg-card border border-border rounded-xl flex items-center justify-center" :class="stat.color">
          <component :is="stat.icon" class="w-5 h-5" />
        </div>
      </div>
    </div>

    <div v-if="workspaceStore.templates.length" class="space-y-3">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <Wand2 class="w-4 h-4 text-accent-blue" />
          <h2 class="text-base font-bold text-white m-0">热门模板</h2>
        </div>
        <button
          type="button"
          class="btn-soft !h-8 !px-3 !rounded-lg"
          @click="router.push({ name: 'templates' })"
        >
          查看全部
          <ArrowRight class="w-3.5 h-3.5 text-accent-blue" />
        </button>
      </div>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
        <button
          v-for="tpl in workspaceStore.templates.slice(0, 4)"
          :key="tpl.id"
          type="button"
          class="btn-soft !h-auto !px-3 !py-3 !rounded-xl flex-col !items-start !justify-start gap-1 text-left w-full"
          @click="router.push({ name: 'create-video', query: { prompt: tpl.prompt, style: tpl.style, duration: String(tpl.duration) } })"
        >
          <div class="text-[10px] text-accent-blue font-mono">{{ tpl.tag }}</div>
          <div class="text-sm font-medium text-white truncate w-full">{{ tpl.name }}</div>
          <div class="text-[10px] text-muted">{{ tpl.duration }}s · {{ tpl.creditsCost }} 点</div>
        </button>
      </div>
    </div>

    <div class="space-y-4">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <FolderKanban class="w-4 h-4 text-accent-blue" />
          <h2 class="text-base font-bold text-white m-0">最近项目</h2>
          <span class="text-xs text-muted font-mono">({{ displayProjects.length }})</span>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div
          v-if="!displayProjects.length"
          class="glass-panel p-8 col-span-full text-center text-muted text-sm"
        >
          暂无项目，点击「AI 创建视频」开始第一个项目
        </div>
        <button
          v-for="project in displayProjects"
          :key="project.id"
          type="button"
          class="btn-soft !h-auto !p-0 !rounded-xl overflow-hidden flex-col !items-stretch !justify-start group w-full text-left"
          @click="openStudio(project.id)"
        >
          <div class="relative h-44 bg-dark overflow-hidden">
            <img
              v-if="project.thumbnail"
              :src="project.thumbnail"
              :alt="project.name"
              class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-90"
            />
            <div
              v-else
              class="w-full h-full flex items-center justify-center bg-card text-muted text-xs font-mono"
            >
              暂无封面
            </div>
            <div class="absolute inset-0 bg-gradient-to-t from-[#1B202A] via-transparent to-transparent opacity-80" />
            <div class="absolute top-3 left-3 flex items-center gap-1.5">
              <span class="px-2 py-0.5 bg-card border border-border text-[10px] font-mono text-white rounded-lg">{{ project.ratio }}</span>
              <span class="px-2 py-0.5 text-[10px] font-mono rounded-lg border" :class="statusLabel(String(project.status)).class">
                {{ statusLabel(String(project.status)).text }}
              </span>
            </div>
            <div class="absolute inset-0 bg-dark/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <div class="btn-soft btn-soft--primary !h-9 !px-4 !rounded-lg text-xs">
                <Play class="w-3.5 h-3.5 text-accent-blue fill-current" />
                打开 AI Studio
              </div>
            </div>
          </div>
          <div class="p-4 space-y-2">
            <div class="flex justify-between text-[11px] text-muted">
              <span class="font-mono">{{ project.category }}</span>
              <span>{{ project.updatedAt }}</span>
            </div>
            <h3 class="text-sm font-medium text-white line-clamp-2 m-0">
              {{ project.name }}
            </h3>
            <div class="text-xs text-muted pt-2 border-t border-border">{{ project.sceneCount }} 个分镜 · {{ project.duration }}s</div>
          </div>
        </button>
      </div>
    </div>
  </div>
</template>
