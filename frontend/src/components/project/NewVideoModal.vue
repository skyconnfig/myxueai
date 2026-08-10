<script setup lang="ts">
import { ref } from 'vue'
import { NButton, NInput, NModal, NSelect } from 'naive-ui'
import { Smartphone, Sparkles, Square, Tv, X } from 'lucide-vue-next'
import { DEMO_PROJECTS } from '@/data/mockData'
import type { DemoProject } from '@/data/mockData'
import { useStudioStore } from '@/stores/studio'
import type { VideoRatio } from '@/types'

const show = defineModel<boolean>('show', { required: true })

const emit = defineEmits<{
  created: [id: string]
}>()

const studioStore = useStudioStore()
const name = ref('')
const category = ref('科技干货')
const ratio = ref<VideoRatio>('9:16')

const categoryOptions = [
  { label: '科技干货', value: '科技干货' },
  { label: '商业认知', value: '商业认知' },
  { label: '前沿趋势', value: '前沿趋势' },
  { label: '实操教程', value: '实操教程' },
]

function handleSubmit() {
  if (!name.value.trim()) return

  const newProject: DemoProject = {
    id: `proj-${Date.now()}`,
    name: name.value.trim(),
    category: category.value,
    status: 'Scripting',
    ratio: ratio.value,
    duration: 60,
    updatedAt: '刚刚',
    thumbnail: DEMO_PROJECTS[0].thumbnail,
    scenes: [
      {
        id: `sc-${Date.now()}-1`,
        index: 1,
        title: '黄金3秒吸睛 Hook',
        description: `欢迎观看《${name.value.trim()}》！今天我们用专业工作流快速剖析其核心要点。`,
        visual: 'Futuristic high definition dark theme workspace UI frame, 8k resolution render',
        voice: `欢迎观看《${name.value.trim()}》！核心亮点速览。`,
        duration: 8,
        cameraAngle: '特写推镜头',
        imageUrl: DEMO_PROJECTS[0].scenes[0].imageUrl,
        voiceoverActor: '云希 (科技专业)',
        transition: 'Fade Up',
        bgmCategory: '科技脉冲',
      },
    ],
  }

  studioStore.projects.unshift(newProject)
  studioStore.selectProject(newProject.id)
  emit('created', newProject.id)
  name.value = ''
}
</script>

<template>
  <NModal
    v-model:show="show"
    :mask-closable="true"
    transform-origin="center"
    class="!max-w-md"
  >
    <div class="bg-[#151922] border border-[#2A303C] rounded-xl p-6 space-y-5 shadow-2xl">
      <div class="flex justify-between items-center border-b border-[#2A303C] pb-3">
        <div class="flex items-center gap-2">
          <Sparkles class="w-5 h-5 text-[#2563EB]" />
          <h2 class="text-base font-bold text-white m-0">新建视频工程项目</h2>
        </div>
        <button class="text-[#A3A8B3] hover:text-white" @click="show = false">
          <X class="w-4 h-4" />
        </button>
      </div>

      <div class="space-y-4">
        <div class="space-y-1.5">
          <label class="text-[11px] text-[#A3A8B3] font-mono">项目名称</label>
          <NInput v-model:value="name" placeholder="例如：AI时代个人IP打造指南" />
        </div>

        <div class="space-y-1.5">
          <label class="text-[11px] text-[#A3A8B3] font-mono">内容分类</label>
          <NSelect v-model:value="category" :options="categoryOptions" />
        </div>

        <div class="space-y-2">
          <label class="text-[11px] text-[#A3A8B3] font-mono">画面比例</label>
          <div class="grid grid-cols-3 gap-2">
            <button
              v-for="opt in ([['9:16', Smartphone], ['16:9', Tv], ['1:1', Square]] as const)"
              :key="opt[0]"
              type="button"
              class="flex flex-col items-center gap-1 py-3 rounded-lg border text-xs transition-all"
              :class="
                ratio === opt[0]
                  ? 'bg-[#2563EB]/15 border-[#2563EB] text-[#2563EB]'
                  : 'bg-[#1B202A] border-[#2A303C] text-[#A3A8B3] hover:border-[#3B4354]'
              "
              @click="ratio = opt[0]"
            >
              <component :is="opt[1]" class="w-4 h-4" />
              {{ opt[0] }}
            </button>
          </div>
        </div>
      </div>

      <NButton type="primary" block class="!h-10" :disabled="!name.trim()" @click="handleSubmit">
        创建并进入 Studio
      </NButton>
    </div>
  </NModal>
</template>
