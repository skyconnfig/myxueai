<script setup lang="ts">
import { useMessage } from 'naive-ui'
import { Image as ImageIcon } from 'lucide-vue-next'
import AiCreatePanel from '@/components/studio/AiCreatePanel.vue'
import AiDirectorPanel from '@/components/studio/AiDirectorPanel.vue'
import CreationPipeline from '@/components/studio/CreationPipeline.vue'
import StoryTimeline from '@/components/studio/StoryTimeline.vue'
import VideoPreviewStudio from '@/components/studio/VideoPreviewStudio.vue'
import { useVideoPlanStudio } from '@/composables/useVideoPlanStudio'
import { DEMO_ASSETS } from '@/data/mockData'
import { useStudioStore } from '@/stores/studio'

const message = useMessage()
const studioStore = useStudioStore()

const {
  router,
  projectId,
  isDemoProject,
  isLoading,
  loadError,
  activeStep,
  selectedSceneId,
  isPlaying,
  currentTime,
  showSubtitles,
  isMuted,
  aiPromptTopic,
  aiStyle,
  isGenerating,
  isOptimizing,
  isRedubbing,
  generationNotice,
  showAssetPicker,
  scriptSource,
  project,
  selectedScene,
  totalDuration,
  activePlayingScene,
  activeSceneStartTime,
  generateProgress,
  updateScene,
  handleGenerate,
  handleAiOptimize,
  handleRedub,
  handleAddScene,
  handleDeleteScene,
  goToProduction,
} = useVideoPlanStudio()

function showComingSoon(feature: string) {
  message.info(`${feature} 功能即将上线（Phase 3）`)
}
</script>

<template>
  <div class="flex flex-col h-[calc(100vh-3.5rem)] bg-dark text-white overflow-hidden select-none">
    <CreationPipeline
      v-model:current-step="activeStep"
      :has-scenes="project.scenes.length > 0"
    />

    <div
      v-if="generationNotice"
      class="mx-4 mb-2 px-3 py-2 btn-soft !h-auto !rounded-xl text-accent-blue text-xs font-mono flex items-center gap-2 shrink-0 pointer-events-none"
    >
      <span class="inline-block w-3 h-3 border-2 border-accent-blue border-t-transparent rounded-full animate-spin" />
      <span>{{ generationNotice }}</span>
      <span v-if="isDemoProject" class="ml-auto text-warning">DEMO</span>
    </div>

    <div v-if="isLoading" class="flex-1 flex items-center justify-center text-sm text-muted">
      正在加载 AI Studio...
    </div>
    <div v-else-if="loadError" class="flex-1 flex items-center justify-center text-sm text-danger">
      {{ loadError }}
    </div>

    <template v-else>
      <div class="flex-1 grid grid-cols-12 gap-0 overflow-hidden min-h-0">
        <div class="col-span-3 bg-surface border-r border-border flex flex-col min-h-0">
          <AiCreatePanel
            v-model:topic="aiPromptTopic"
            v-model:style="aiStyle"
            :is-generating="isGenerating"
            :scenes="project.scenes"
            :selected-scene-id="selectedSceneId"
            :script-source="scriptSource"
            @generate="handleGenerate"
            @add-scene="handleAddScene"
            @select-scene="selectedSceneId = $event"
          />
        </div>

        <div class="col-span-6 bg-dark flex flex-col min-h-0 border-r border-border">
          <VideoPreviewStudio
            :scene="activePlayingScene"
            :ratio="studioStore.aspectRatio"
            :current-time="currentTime"
            :total-duration="totalDuration"
            :is-playing="isPlaying"
            :show-subtitles="showSubtitles"
            :is-muted="isMuted"
            :project-name="project.name"
            :style="project.category"
            :progress="generateProgress"
            :has-scenes="project.scenes.length > 0"
            :is-optimizing="isOptimizing || isRedubbing"
            :scene-start-time="activeSceneStartTime"
            @update:current-time="currentTime = $event"
            @update:is-playing="isPlaying = $event"
            @update:show-subtitles="showSubtitles = $event"
            @update:is-muted="isMuted = $event"
            @ai-optimize="handleAiOptimize"
            @change-style="showComingSoon('改变风格')"
            @redub="handleRedub"
            @auto-edit="showComingSoon('自动剪辑')"
            @edit-subtitles="showComingSoon('修改字幕')"
          />
        </div>

        <div class="col-span-3 bg-surface min-h-0 border-l border-border">
          <AiDirectorPanel
            :scene="selectedScene"
            :project-topic="aiPromptTopic"
            @update="selectedScene && updateScene(selectedScene.id, $event)"
            @delete="selectedScene && handleDeleteScene(selectedScene.id)"
            @replace-asset="showAssetPicker = true"
            @save-draft="router.push({ name: 'dashboard' })"
            @start-render="goToProduction"
          />
        </div>
      </div>

      <StoryTimeline
        :scenes="project.scenes"
        :selected-scene-id="selectedSceneId"
        :is-playing="isPlaying"
        @select-scene="selectedSceneId = $event"
      />
    </template>

    <div
      v-if="showAssetPicker"
      class="fixed inset-0 bg-dark/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      @click.self="showAssetPicker = false"
    >
      <div class="glass-panel max-w-2xl w-full p-5 space-y-4 shadow-glow-purple">
        <div class="flex justify-between items-center border-b border-border pb-3">
          <h3 class="text-base font-semibold text-white m-0 flex items-center gap-2">
            <ImageIcon class="w-4 h-4 text-accent-blue" />
            选择资产替换画面
          </h3>
          <button class="text-muted hover:text-white" @click="showAssetPicker = false">✕</button>
        </div>
        <div class="grid grid-cols-3 gap-3 max-h-80 overflow-y-auto">
          <button
            v-for="ast in DEMO_ASSETS.filter((a) => a.url)"
            :key="ast.id"
            class="bg-card border border-border rounded-xl overflow-hidden hover:border-accent-blue/50 group text-left"
            @click="selectedScene && updateScene(selectedScene.id, { imageUrl: ast.url }); showAssetPicker = false"
          >
            <img :src="ast.url" alt="" class="w-full h-24 object-cover group-hover:scale-105 transition-transform" />
            <div class="p-2 text-[11px] text-white truncate font-medium">{{ ast.title }}</div>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
