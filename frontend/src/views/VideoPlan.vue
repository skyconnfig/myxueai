<script setup lang="ts">
import { Image as ImageIcon } from 'lucide-vue-next'
import ChangeStyleModal from '@/components/studio/ChangeStyleModal.vue'
import EditSubtitlesModal from '@/components/studio/EditSubtitlesModal.vue'
import AiCreatePanel from '@/components/studio/AiCreatePanel.vue'
import AiDirectorPanel from '@/components/studio/AiDirectorPanel.vue'
import ActiveSkillsPanel from '@/components/studio/ActiveSkillsPanel.vue'
import CreationPipeline from '@/components/studio/CreationPipeline.vue'
import DirectorBriefPanel from '@/components/studio/DirectorBriefPanel.vue'
import StoryTimeline from '@/components/studio/StoryTimeline.vue'
import VideoPreviewStudio from '@/components/studio/VideoPreviewStudio.vue'
import { useVideoPlanStudio } from '@/composables/useVideoPlanStudio'
import { fetchAssets } from '@/api/asset'
import type { AssetDto } from '@xueai/shared'
import { DEMO_ASSETS } from '@/data/mockData'
import { useStudioStore } from '@/stores/studio'
import { ref, watch } from 'vue'

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
  volume,
  aiPromptTopic,
  aiStyle,
  isGenerating,
  isOptimizing,
  isRedubbing,
  isGeneratingVoice,
  isChangingStyle,
  showStyleModal,
  isAutoEditing,
  showSubtitlesModal,
  isSavingSubtitles,
  generationNotice,
  showAssetPicker,
  scriptSource,
  agentPlan,
  activeSkillIds,
  project,
  selectedScene,
  totalDuration,
  activePlayingScene,
  activeSceneStartTime,
  previewScene,
  previewSceneStartTime,
  selectedSceneLocalTime,
  generateProgress,
  updateScene,
  handleGenerate,
  handlePreviewPlaying,
  handleAiOptimize,
  handleChangeStyle,
  openStyleModal,
  handleAutoEdit,
  openSubtitlesModal,
  handleSaveSubtitles,
  handleRedub,
  handleRegenerateImage,
  handleAddScene,
  handleDeleteScene,
  goToProduction,
} = useVideoPlanStudio()

const assetOptions = ref<Array<{ id: string; title: string; url: string }>>([])

watch(showAssetPicker, async (open) => {
  if (!open || isDemoProject.value) {
    assetOptions.value = DEMO_ASSETS.filter((a) => a.url).map((a) => ({
      id: a.id,
      title: a.title,
      url: a.url,
    }))
    return
  }
  try {
    const assets = await fetchAssets({ projectId: projectId.value, type: 'image' })
    assetOptions.value = assets
      .filter((a: AssetDto) => a.url)
      .map((a: AssetDto) => ({ id: a.id, title: a.name ?? a.id, url: a.url! }))
    if (!assetOptions.value.length) {
      assetOptions.value = DEMO_ASSETS.filter((a) => a.url).map((a) => ({
        id: a.id,
        title: a.title,
        url: a.url,
      }))
    }
  } catch {
    assetOptions.value = DEMO_ASSETS.filter((a) => a.url).map((a) => ({
      id: a.id,
      title: a.title,
      url: a.url,
    }))
  }
})
</script>

<template>
  <div class="flex flex-col h-[calc(100vh-3.5rem)] bg-dark text-white overflow-hidden select-none">
    <CreationPipeline
      v-model:current-step="activeStep"
      :has-scenes="project.scenes.length > 0"
    />

    <div
      v-if="generationNotice"
      class="mx-4 mb-2 ui-notice shrink-0 pointer-events-none"
    >
      <span class="ui-notice__spinner" />
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
          <DirectorBriefPanel
            :brief="project.directorBrief"
            :topic="aiPromptTopic"
            :audience="project.audience"
            :goal="project.goal"
            :video-style="project.videoStyle"
            :duration="project.duration"
          />
          <ActiveSkillsPanel
            :skill-ids="activeSkillIds"
            :agent-category="agentPlan?.category"
          />
          <AiCreatePanel
            class="flex-1 min-h-0"
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
            :scene="previewScene"
            :ratio="studioStore.aspectRatio"
            :current-time="currentTime"
            :total-duration="totalDuration"
            :is-playing="isPlaying"
            :show-subtitles="showSubtitles"
            :is-muted="isMuted"
            :volume="volume"
            :project-name="project.name"
            :style="project.category"
            :progress="generateProgress"
            :has-scenes="project.scenes.length > 0"
            :is-optimizing="isOptimizing || isRedubbing || isChangingStyle || isAutoEditing || isSavingSubtitles || isGeneratingVoice"
            :is-audio-loading="isGeneratingVoice"
            :scene-start-time="previewSceneStartTime"
            @update:current-time="currentTime = $event"
            @update:is-playing="handlePreviewPlaying"
            @update:show-subtitles="showSubtitles = $event"
            @update:is-muted="isMuted = $event"
            @update:volume="volume = $event"
            @ai-optimize="handleAiOptimize"
            @change-style="openStyleModal"
            @redub="handleRedub"
            @auto-edit="handleAutoEdit"
            @edit-subtitles="openSubtitlesModal"
          />
        </div>

        <div class="col-span-3 bg-surface min-h-0 border-l border-border">
          <AiDirectorPanel
            :scene="selectedScene"
            :project-topic="aiPromptTopic"
            :scene-local-time="selectedSceneLocalTime"
            @update="selectedScene && updateScene(selectedScene.id, $event)"
            @delete="selectedScene && handleDeleteScene(selectedScene.id)"
            @replace-asset="selectedScene && handleRegenerateImage(selectedScene.id)"
            @save-draft="router.push({ name: 'dashboard' })"
            @start-render="goToProduction"
          />
        </div>
      </div>

      <StoryTimeline
        :scenes="project.scenes"
        :selected-scene-id="selectedSceneId"
        :is-playing="isPlaying"
        :total-duration="totalDuration"
        :bgm-category="project.bgmCategory"
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
            v-for="ast in assetOptions"
            :key="ast.id"
            class="bg-card border border-border rounded-xl overflow-hidden hover:border-accent-blue/50 group text-left"
            @click="selectedScene && updateScene(selectedScene.id, { imageUrl: ast.url, imageSource: 'manual' }); showAssetPicker = false"
          >
            <img :src="ast.url" alt="" class="w-full h-24 object-cover group-hover:scale-105 transition-transform" />
            <div class="p-2 text-[11px] text-white truncate font-medium">{{ ast.title }}</div>
          </button>
        </div>
      </div>
    </div>

    <ChangeStyleModal
      :show="showStyleModal"
      :current-style="project.videoStyle"
      :loading="isChangingStyle"
      @close="showStyleModal = false"
      @apply="handleChangeStyle"
    />

    <EditSubtitlesModal
      :show="showSubtitlesModal"
      :scene="selectedScene"
      :loading="isSavingSubtitles"
      @close="showSubtitlesModal = false"
      @save="handleSaveSubtitles"
    />
  </div>
</template>
