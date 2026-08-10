<script setup lang="ts">

import { computed, onMounted, ref } from 'vue'

import { useRoute, useRouter } from 'vue-router'

import { NAvatar, NBadge } from 'naive-ui'

import {

  Check,

  ChevronDown,

  Coins,

  ListTodo,

  Play,

  Smartphone,

  Sparkles,

  Square,

  Tv,

  Video,

} from 'lucide-vue-next'

import { useStudioStore } from '@/stores/studio'
import { useWorkspaceStore } from '@/stores/workspace'
import { useAuthStore } from '@/stores/auth'

import type { VideoRatio } from '@/types'



defineProps<{

  showAspectRatio?: boolean

}>()



defineEmits<{

  openNewProject: []

  quickRender: []

}>()



const route = useRoute()

const router = useRouter()

const studioStore = useStudioStore()
const workspaceStore = useWorkspaceStore()
const authStore = useAuthStore()
const showDropdown = ref(false)
const showTaskPanel = ref(false)

onMounted(() => {
  void workspaceStore.loadSummary()
  void authStore.init()
})

const taskBadgeCount = computed(() => workspaceStore.runningCount + workspaceStore.queueCount)



const currentProject = computed(() => {

  const id = route.params.id as string | undefined

  if (id?.startsWith('demo')) return studioStore.getProjectById(id)

  return studioStore.currentProject

})



function setAspectRatio(ratio: VideoRatio) {

  studioStore.aspectRatio = ratio

}



function selectProject(id: string) {

  studioStore.selectProject(id)

  showDropdown.value = false

  router.push({ name: 'video-plan', params: { id } })

}

</script>



<template>

  <header class="h-14 bg-dark border-b border-border px-4 flex items-center justify-between z-30 sticky top-0 shrink-0">

    <div class="flex items-center gap-4 min-w-0">

      <div class="flex items-center gap-2.5 shrink-0">

        <div class="w-8 h-8 bg-card border border-border rounded-lg flex items-center justify-center font-black text-sm">

          <span class="text-accent-blue">X</span>

        </div>

        <div class="hidden sm:flex flex-col">

          <div class="flex items-center gap-1.5">

            <span class="font-bold text-base text-white">XueAI</span>

            <span class="text-[10px] px-1.5 py-0.5 glass-panel text-muted rounded font-mono">

              Video Factory

            </span>

          </div>

          <span class="text-[10px] text-muted font-mono tracking-wider">AI 视频生产操作系统</span>

        </div>

      </div>



      <div class="h-4 w-px bg-border hidden sm:block" />



      <div class="relative">

        <button

          type="button"

          class="btn-soft !h-8 !px-3 !rounded-lg max-w-[280px]"

          @click="showDropdown = !showDropdown"

        >

          <Video class="w-3.5 h-3.5 text-accent-blue shrink-0" />

          <span class="truncate">{{ currentProject?.name ?? '选择项目' }}</span>

          <ChevronDown class="w-3.5 h-3.5 text-muted shrink-0" />

        </button>



        <div

          v-if="showDropdown"

          class="absolute left-0 mt-1.5 w-72 bg-surface border border-border rounded-xl p-1.5 z-50"

        >

          <div class="px-2 py-1.5 mb-1 flex justify-between items-center">

            <span class="text-[10px] font-medium text-muted/60 tracking-wide">最近项目</span>

            <button

              type="button"

              class="btn-soft !h-7 !px-2 !rounded-lg !text-[11px]"

              @click="$emit('openNewProject'); showDropdown = false"

            >

              + 新建

            </button>

          </div>

          <div class="max-h-60 overflow-y-auto space-y-0.5">

            <button

              v-for="proj in studioStore.projects"

              :key="proj.id"

              type="button"

              class="btn-nav !items-start"

              :class="currentProject?.id === proj.id ? 'btn-nav--active' : ''"

              @click="selectProject(proj.id)"

            >

              <Video

                class="w-4 h-4 shrink-0 mt-0.5"

                :class="currentProject?.id === proj.id ? 'text-accent-blue' : ''"

              />

              <div class="min-w-0 flex-1 text-left">

                <div class="truncate text-sm" :class="currentProject?.id === proj.id ? 'text-white font-medium' : ''">

                  {{ proj.name }}

                </div>

                <div class="text-[11px] text-muted mt-0.5 truncate">

                  {{ proj.category }} · {{ proj.scenes.length }} 镜头

                </div>

              </div>

              <Check

                v-if="currentProject?.id === proj.id"

                class="w-3.5 h-3.5 text-accent-blue shrink-0 mt-0.5"

              />

            </button>

          </div>

        </div>

      </div>



      <div class="hidden md:inline-flex btn-soft !h-8 !px-2.5 !rounded-lg !text-[11px] !font-normal pointer-events-none">

        <div

          class="w-1.5 h-1.5 rounded-full"

          :class="studioStore.isSaving ? 'bg-warning animate-ping' : 'bg-success'"

        />

        <span class="text-muted">{{ studioStore.isSaving ? '同步中...' : '已保存' }}</span>

      </div>

    </div>



    <div v-if="showAspectRatio" class="hidden lg:inline-flex items-center gap-0.5 p-0.5 rounded-lg border border-border bg-surface">

      <button

        v-for="opt in ([['9:16', Smartphone], ['16:9', Tv], ['1:1', Square]] as const)"

        :key="opt[0]"

        type="button"

        class="btn-nav !w-auto !px-2.5 !py-1.5 !text-xs"

        :class="studioStore.aspectRatio === opt[0] ? 'btn-nav--active' : ''"

        @click="setAspectRatio(opt[0])"

      >

        <component

          :is="opt[1]"

          class="w-3.5 h-3.5"

          :class="studioStore.aspectRatio === opt[0] ? 'text-accent-blue' : ''"

        />

        <span>{{ opt[0] }}</span>

      </button>

    </div>



    <div class="flex items-center gap-2 shrink-0">

      <div class="hidden md:inline-flex btn-soft !h-8 !px-2.5 !rounded-lg !text-[11px] !font-normal pointer-events-none">

        <Coins class="w-3.5 h-3.5 text-accent-blue" />

        <span class="text-muted">AI 点数</span>

        <span class="text-white font-semibold font-mono">{{ workspaceStore.credits.toLocaleString() }}</span>

      </div>



      <div class="relative hidden sm:block">

        <NBadge :value="taskBadgeCount || undefined" :max="99" type="info">

          <button

            type="button"

            class="btn-soft !h-8 !px-2.5 !rounded-lg"

            @click="showTaskPanel = !showTaskPanel"

          >

            <ListTodo class="w-3.5 h-3.5 text-accent-blue" />

            <span class="hidden lg:inline">任务</span>

          </button>

        </NBadge>

        <div
          v-if="showTaskPanel"
          class="absolute right-0 mt-2 w-64 bg-surface border border-border rounded-xl p-2 z-50"
        >

          <div class="px-2 py-1.5 text-[10px] font-medium text-muted/60 tracking-wide mb-1">AI 任务中心</div>

          <div class="space-y-0.5 max-h-48 overflow-y-auto">

            <div v-if="!workspaceStore.recentTasks.length" class="px-3 py-2 text-[11px] text-muted">暂无进行中的任务</div>

            <div

              v-for="task in workspaceStore.recentTasks.slice(0, 6)"

              :key="task.id"

              class="btn-nav !cursor-default"

            >

              <span class="text-white truncate flex-1 text-left">{{ task.projectName }}</span>

              <span class="text-accent-blue font-mono shrink-0 text-[11px]">{{ task.type }} · {{ task.progress }}%</span>

            </div>

            <div class="mx-2 mt-1 pt-2 border-t border-border space-y-1 text-[11px] text-muted">

              <div class="flex justify-between px-1">

                <span>正在生成</span>

                <span class="text-accent-blue font-mono">{{ workspaceStore.runningCount }} 个</span>

              </div>

              <div class="flex justify-between px-1">

                <span>队列等待</span>

                <span class="text-accent-blue font-mono">{{ workspaceStore.queueCount }} 个</span>

              </div>

            </div>

          </div>

        </div>

      </div>



      <button

        type="button"

        class="hidden sm:inline-flex btn-soft !h-8 !px-3 !rounded-lg"

        @click="$emit('openNewProject')"

      >

        <Sparkles class="w-3.5 h-3.5 text-accent-blue" />

        <span>新建</span>

      </button>

      <button

        type="button"

        class="btn-soft btn-soft--primary !h-8 !px-3.5 !rounded-lg"

        @click="$emit('quickRender')"

      >

        <Play class="w-3.5 h-3.5 text-accent-blue fill-current" />

        <span class="hidden sm:inline">开始渲染</span>

      </button>

      <NAvatar
        round
        :size="32"
        class="!bg-card !border !border-border text-[10px] font-bold text-white cursor-pointer"
        @click="router.push({ name: 'login' })"
      >
        {{ authStore.displayName.slice(0, 2).toUpperCase() }}
      </NAvatar>

    </div>

  </header>

</template>

