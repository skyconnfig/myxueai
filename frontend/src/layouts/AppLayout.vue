<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMessage } from 'naive-ui'
import AppHeader from '@/components/layout/AppHeader.vue'
import AppSidebar from '@/components/layout/AppSidebar.vue'
import NewVideoModal from '@/components/project/NewVideoModal.vue'
import { startRender } from '@/api/render'
import { useStudioStore } from '@/stores/studio'

const route = useRoute()
const router = useRouter()
const message = useMessage()
const studioStore = useStudioStore()

const showNewModal = ref(false)
const renderNotice = ref<string | null>(null)
const rendering = ref(false)

const isStudioLayout = computed(() =>
  ['video-plan', 'production'].includes(String(route.name)),
)

const currentProjectId = computed(() => {
  const id = route.params.id as string | undefined
  return id && !id.startsWith('demo') ? id : studioStore.currentProject?.id
})

function openNewProject() {
  showNewModal.value = true
}

async function handleQuickRender() {
  const projectId = currentProjectId.value
  if (!projectId) {
    message.warning('请先选择或创建项目')
    return
  }

  const project = studioStore.currentProject
  rendering.value = true
  renderNotice.value = `正在唤醒渲染引擎，合成视频《${project.name}》...`

  try {
    const result = await startRender(projectId)
    renderNotice.value = result.usedRemotion
      ? `渲染成功！MP4 已输出`
      : `预览已生成（Remotion 未就绪，已输出 HTML 预览）`
    message.success('渲染完成')
    router.push({ name: 'video-detail', params: { id: projectId } })
  } catch (err) {
    message.error(err instanceof Error ? err.message : '渲染失败')
    renderNotice.value = null
  } finally {
    rendering.value = false
    window.setTimeout(() => {
      renderNotice.value = null
    }, 3500)
  }
}

function onProjectCreated(id: string) {
  showNewModal.value = false
  router.push({ name: 'video-plan', params: { id } })
}
</script>

<template>
  <div class="flex flex-col min-h-screen bg-dark text-white selection:bg-accent-blue/30">
    <AppHeader
      :show-aspect-ratio="isStudioLayout"
      @open-new-project="openNewProject"
      @quick-render="handleQuickRender"
    />

    <div class="flex-1 flex overflow-hidden">
      <AppSidebar />

      <main
        class="flex-1 bg-dark"
        :class="isStudioLayout ? 'overflow-hidden' : 'overflow-y-auto'"
      >
        <RouterView />
      </main>
    </div>

    <div
      v-if="renderNotice"
      class="fixed bottom-6 right-6 z-50 ui-notice shadow-2xl"
    >
      <span
        class="ui-notice__spinner"
        :class="rendering ? '' : '!border-t-accent-blue !animate-none'"
      />
      <span>{{ renderNotice }}</span>
    </div>

    <NewVideoModal
      v-model:show="showNewModal"
      @created="onProjectCreated"
    />
  </div>
</template>
