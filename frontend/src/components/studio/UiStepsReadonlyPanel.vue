<script setup lang="ts">
import { computed } from 'vue'
import { MousePointer2, Route } from 'lucide-vue-next'
import type { UiStep } from '@xueai/shared'

const props = defineProps<{
  steps?: UiStep[] | null
  duration: number
  componentType?: string | null
  purpose?: string | null
  highlightAtSec?: number | null
}>()

const ACTION_LABELS: Record<string, string> = {
  move: '移动',
  click: '点击',
  navigate: '切换页面',
  dataChange: '数据变化',
  type: '输入',
}

const ACTION_COLORS: Record<string, string> = {
  move: 'text-accent-blue bg-accent-blue/15 border-accent-blue/30',
  click: 'text-warning bg-warning/15 border-warning/30',
  navigate: 'text-accent-purple bg-accent-purple/15 border-accent-purple/30',
  dataChange: 'text-success bg-success/15 border-success/30',
  type: 'text-white bg-white/10 border-white/20',
}

const showPanel = computed(() => {
  const type = props.componentType ?? ''
  const purpose = props.purpose ?? ''
  return (
    props.steps?.length ||
    type === 'ProductDemo' ||
    type === 'BrowserWindow' ||
    purpose === 'demo' ||
    purpose === 'solution'
  )
})

const activeIndex = computed(() => {
  if (props.highlightAtSec == null || !props.steps?.length) return -1
  const t = props.highlightAtSec
  let index = -1
  for (let i = 0; i < props.steps.length; i++) {
    if (t >= props.steps[i].at) index = i
  }
  return index
})

function formatDetail(step: UiStep): string {
  const parts: string[] = []
  if (step.target) parts.push(step.target)
  if (step.value != null) parts.push(String(step.value))
  if (step.x != null && step.y != null) {
    parts.push(`(${(step.x * 100).toFixed(0)}%, ${(step.y * 100).toFixed(0)}%)`)
  }
  return parts.join(' · ') || '—'
}

function actionLabel(action: string) {
  return ACTION_LABELS[action] ?? action
}

function actionColor(action: string) {
  return ACTION_COLORS[action] ?? 'text-muted bg-dark/60 border-border'
}
</script>

<template>
  <div v-if="showPanel" class="space-y-2">
    <div class="flex items-center justify-between">
      <label class="text-muted text-[11px] font-mono flex items-center gap-1.5">
        <MousePointer2 class="w-3 h-3" />
        UI 交互时间轴
      </label>
      <span class="text-[10px] font-mono text-muted">
        {{ steps?.length ?? 0 }} 步 · {{ duration }}s
      </span>
    </div>

    <div v-if="!steps?.length" class="glass-panel p-3 text-[11px] text-muted leading-relaxed">
      暂无 AI 生成的交互步骤，渲染时将使用默认演示流程。
    </div>

    <div v-else class="glass-panel p-2 space-y-1 max-h-52 overflow-y-auto">
      <div
        v-for="(step, index) in steps"
        :key="`${step.at}-${step.action}-${index}`"
        class="flex items-start gap-2 rounded-lg px-2 py-1.5 border transition-colors"
        :class="
          index === activeIndex
            ? 'border-accent-blue/50 bg-accent-blue/10'
            : 'border-transparent hover:bg-white/5'
        "
      >
        <span class="shrink-0 w-10 text-[10px] font-mono text-accent-blue tabular-nums pt-0.5">
          {{ step.at.toFixed(1) }}s
        </span>
        <span
          class="shrink-0 px-1.5 py-0.5 rounded border text-[10px] font-mono"
          :class="actionColor(step.action)"
        >
          {{ actionLabel(step.action) }}
        </span>
        <span class="text-[10px] text-white/80 font-mono leading-relaxed break-all min-w-0">
          {{ formatDetail(step) }}
        </span>
      </div>
    </div>

    <p class="text-[10px] text-muted m-0 flex items-center gap-1">
      <Route class="w-3 h-3 shrink-0" />
      只读预览 · 由 AI Director 生成，写入 cues.sceneProps.steps
    </p>
  </div>
</template>
