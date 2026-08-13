<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Download, ExternalLink, Rocket, Share2 } from 'lucide-vue-next'
import { useProjectStore } from '@/stores/project'

const router = useRouter()
const projectStore = useProjectStore()

onMounted(() => {
  void projectStore.loadProjects()
})

const readyProjects = computed(() =>
  projectStore.projects.filter((p) => p.videoUrl || p.status === 'COMPLETED' || p.status === 'Ready'),
)

function openProject(id: string) {
  router.push({ name: 'video-detail', params: { id } })
}
</script>

<template>
  <div class="p-6 max-w-5xl mx-auto space-y-6">
    <div>
      <div class="flex items-center gap-2 text-accent-purple mb-1">
        <Rocket class="w-4 h-4" />
        <span class="text-xs font-mono uppercase tracking-wider">Distribution Hub</span>
      </div>
      <h1 class="text-2xl font-bold text-white m-0">分发中心</h1>
      <p class="text-sm text-muted mt-1 mb-0">导出成片、复制链接，准备发布到各平台</p>
    </div>

    <div v-if="!readyProjects.length" class="glass-panel p-12 text-center text-muted text-sm">
      暂无可分发成片，请先完成至少一个项目的生产渲染。
    </div>

    <div v-else class="space-y-3">
      <div
        v-for="project in readyProjects"
        :key="project.id"
        class="glass-panel p-4 flex flex-col sm:flex-row sm:items-center gap-4"
      >
        <div class="flex-1 min-w-0">
          <h3 class="text-sm font-semibold text-white m-0 truncate">{{ project.name }}</h3>
          <p class="text-xs text-muted m-0 mt-1 font-mono">{{ project.ratio }} · {{ project.duration }}s</p>
        </div>
        <div class="flex flex-wrap gap-2 shrink-0">
          <button type="button" class="btn-soft !h-9 !px-3 !text-xs" @click="openProject(project.id)">
            <ExternalLink class="w-3.5 h-3.5" />
            查看详情
          </button>
          <a
            v-if="project.videoUrl"
            :href="project.videoUrl"
            target="_blank"
            rel="noopener"
            class="btn-soft btn-soft--primary !h-9 !px-3 !text-xs inline-flex items-center gap-1.5"
          >
            <Download class="w-3.5 h-3.5" />
            下载 MP4
          </a>
          <button type="button" class="btn-soft !h-9 !px-3 !text-xs" disabled title="平台直连发布即将上线">
            <Share2 class="w-3.5 h-3.5" />
            发布
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
