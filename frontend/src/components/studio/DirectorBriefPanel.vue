<script setup lang="ts">
import { computed, ref } from 'vue'
import { useMessage } from 'naive-ui'
import { Clapperboard, Film, Sparkles, Target, Users } from 'lucide-vue-next'
import { previewDirectorBrief } from '@/api/director'
import type { DirectorBrief } from '@/types'

const props = defineProps<{
  brief: DirectorBrief | null | undefined
  topic: string
  audience?: string | null
  goal?: string | null
  videoStyle?: string | null
  duration?: number
}>()

const message = useMessage()
const previewing = ref(false)
const localBrief = ref<DirectorBrief | null>(null)

const displayBrief = computed(() => localBrief.value ?? props.brief ?? null)

const beatLabels: Record<string, string> = {
  pain: '痛点',
  solution: '方案',
  result: '成果',
  cta: '行动号召',
}

async function previewPlan() {
  if (!props.topic.trim()) {
    message.warning('请先填写视频主题')
    return
  }
  previewing.value = true
  try {
    const data = await previewDirectorBrief({
      topic: props.topic,
      audience: props.audience ?? undefined,
      goal: props.goal ?? undefined,
      videoStyle: props.videoStyle ?? undefined,
      duration: props.duration ?? 30,
    })
    localBrief.value = data.brief
    message.success('AI 导演方案已生成')
  } catch (err) {
    message.error(err instanceof Error ? err.message : '导演方案生成失败')
  } finally {
    previewing.value = false
  }
}
</script>

<template>
  <div class="director-brief space-y-3 p-4 border-b border-border">
    <div class="flex items-center justify-between gap-2">
      <div class="flex items-center gap-2">
        <Clapperboard class="w-4 h-4 text-accent-purple" />
        <h3 class="text-sm font-semibold text-white m-0">AI 导演方案</h3>
      </div>
      <button
        type="button"
        class="btn-soft !h-7 !px-2.5 !text-[11px] !rounded-lg"
        :disabled="previewing"
        @click="previewPlan"
      >
        <Sparkles class="w-3 h-3 text-accent-blue" />
        {{ previewing ? '生成中...' : '预览方案' }}
      </button>
    </div>

    <p v-if="!displayBrief" class="text-xs text-muted m-0 leading-relaxed">
      生成脚本前，AI 导演会先规划故事弧、镜头风格与商业目标。点击「预览方案」或「AI 创建视频」后此处显示。
    </p>

    <template v-else>
      <div class="glass-panel p-3 space-y-2 text-xs">
        <div class="flex items-start gap-2">
          <Film class="w-3.5 h-3.5 text-accent-blue shrink-0 mt-0.5" />
          <div>
            <div class="text-muted">视觉风格</div>
            <div class="text-white">{{ displayBrief.video_style }}</div>
          </div>
        </div>
        <div class="flex items-start gap-2">
          <Users class="w-3.5 h-3.5 text-accent-purple shrink-0 mt-0.5" />
          <div>
            <div class="text-muted">目标受众</div>
            <div class="text-white">{{ displayBrief.audience ?? '—' }}</div>
          </div>
        </div>
        <div class="flex items-start gap-2">
          <Target class="w-3.5 h-3.5 text-success shrink-0 mt-0.5" />
          <div>
            <div class="text-muted">视频目标</div>
            <div class="text-white">{{ displayBrief.goal ?? '—' }}</div>
          </div>
        </div>
      </div>

      <div class="space-y-1.5">
        <div class="text-[11px] text-muted font-mono uppercase tracking-wide">故事弧 Story Arc</div>
        <div
          v-for="(beat, i) in displayBrief.story_arc"
          :key="i"
          class="flex gap-2 items-start bg-dark/50 border border-border/60 rounded-lg px-2.5 py-2"
        >
          <span class="text-[10px] font-mono text-accent-blue shrink-0 w-12">
            {{ beatLabels[beat.type] ?? beat.type }}
          </span>
          <span class="text-[11px] text-white/90 flex-1">{{ beat.beat ?? beat.label ?? '—' }}</span>
          <span class="text-[10px] text-muted font-mono">{{ beat.duration }}s</span>
        </div>
      </div>
    </template>
  </div>
</template>
