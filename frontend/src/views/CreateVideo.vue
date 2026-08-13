<script setup lang="ts">

import { onMounted, ref } from 'vue'

import { useRoute, useRouter } from 'vue-router'

import { useMessage } from 'naive-ui'

import { ArrowRight, Sparkles, Wand2 } from 'lucide-vue-next'

import { COMMERCIAL_STYLE_PRESETS, GOAL_PRESETS } from '@xueai/shared'

import type { VideoRatio } from '@/types'

import { applyVideoTemplate } from '@/api/template'

import TemplatePicker from '@/components/intelligence/TemplatePicker.vue'

import { useProjectStore } from '@/stores/project'

import { useStudioStore } from '@/stores/studio'

import { useWorkspaceStore } from '@/stores/workspace'

import { loadSelectedSkillIds, saveSelectedSkillIds } from '@/api/skills'



const route = useRoute()

const router = useRouter()

const message = useMessage()

const projectStore = useProjectStore()

const studioStore = useStudioStore()

const workspaceStore = useWorkspaceStore()



const prompt = ref('')

const ratio = ref<VideoRatio>('9:16')

const duration = ref(30)

const category = ref('科技干货')

const audience = ref('企业运营管理者')

const goal = ref('conversion')

const videoStyle = ref('apple_saas_commercial')

const submitting = ref(false)
const selectedSkillIds = ref<string[]>(loadSelectedSkillIds())



onMounted(() => {

  void workspaceStore.loadTemplates()

  void workspaceStore.loadSummary()

  const q = route.query

  if (typeof q.prompt === 'string') prompt.value = q.prompt

  if (typeof q.style === 'string') category.value = q.style

  if (typeof q.duration === 'string') duration.value = Number(q.duration) || 30

  if (q.ratio === '9:16' || q.ratio === '16:9' || q.ratio === '1:1') ratio.value = q.ratio

  if (typeof q.skills === 'string' && q.skills) {
    selectedSkillIds.value = q.skills.split(',').filter(Boolean)
    saveSelectedSkillIds(selectedSkillIds.value)
  } else if (typeof q.skill === 'string' && q.skill) {
    selectedSkillIds.value = [...new Set([...selectedSkillIds.value, q.skill])]
    saveSelectedSkillIds(selectedSkillIds.value)
  }

})



async function handleSubmit() {

  if (!prompt.value.trim()) {

    message.warning('请描述你想制作的视频')

    return

  }



  submitting.value = true

  try {

    const project = await projectStore.addProject({

      prompt: prompt.value.trim(),

      ratio: ratio.value,

      duration: duration.value,

      style: category.value,

      audience: audience.value,

      goal: GOAL_PRESETS.find((item) => item.id === goal.value)?.label ?? goal.value,

      videoStyle: videoStyle.value,

    })

    if (selectedTemplateSlug.value) {
      try {
        await applyVideoTemplate(project.id, selectedTemplateSlug.value)
      } catch {
        // template apply optional
      }
    }

    message.success('项目创建成功，即将进入 AI Studio')

    await router.push({ name: 'video-plan', params: { id: project.id } })

  } catch {

    studioStore.selectProject('demo-1')

    message.info('后端未连接，进入演示 Studio')

    await router.push({ name: 'video-plan', params: { id: 'demo-1' } })

  } finally {

    submitting.value = false

  }

}



const selectedTemplateSlug = ref<string | null>(null)

function onTemplateSelect(tpl: DbVideoTemplate) {
  selectedTemplateSlug.value = tpl.slug
  prompt.value = (tpl.config as { prompt?: string })?.prompt ?? `使用 ${tpl.name} 模板创建商业视频`
  duration.value = tpl.duration
  if (tpl.ratio === '16:9' || tpl.ratio === '1:1' || tpl.ratio === '9:16') ratio.value = tpl.ratio as VideoRatio
  category.value = tpl.category
}

</script>



<template>

  <div class="min-h-full p-6">

    <div class="max-w-2xl mx-auto space-y-6">

      <div class="text-center space-y-2">

        <span class="inline-block px-2 py-0.5 glass-panel text-accent-purple text-[11px] font-mono rounded-full">

          AI 导演中心

        </span>

        <h1 class="text-xl font-bold text-white m-0">输入一个想法，AI 完成剩下的事</h1>

        <p class="text-sm text-muted m-0">导演 Brief · 故事弧 · 电影分镜 · 素材 · 渲染</p>

        <div v-if="selectedSkillIds.length" class="flex flex-wrap justify-center gap-2 pt-2">
          <span class="text-[10px] text-muted">已选 Skill:</span>
          <span
            v-for="id in selectedSkillIds"
            :key="id"
            class="text-[10px] font-mono px-2 py-0.5 rounded-lg bg-card border border-accent-blue/40 text-accent-blue"
          >
            {{ id }}
          </span>
          <button
            class="text-[10px] text-muted hover:text-white underline"
            type="button"
            @click="router.push({ name: 'skills-marketplace' })"
          >
            管理
          </button>
        </div>

      </div>



      <div class="glass-panel p-5 space-y-4">

        <div class="flex items-center gap-2 text-sm font-semibold text-white">

          <Wand2 class="w-4 h-4 text-accent-blue" />

          视频创意

        </div>

        <textarea

          v-model="prompt"

          rows="4"

          placeholder="例如：制作一个 30 秒 SaaS 客户管理系统宣传视频，面向企业老板，强调自动化提效..."

          class="w-full bg-dark/60 border border-border rounded-xl px-3 py-2.5 text-sm text-white placeholder-muted focus:outline-none focus:border-accent-blue resize-none"

        />



        <div class="grid grid-cols-2 gap-3">

          <div class="space-y-1.5">

            <label class="text-[11px] text-muted font-mono">目标受众</label>

            <input

              v-model="audience"

              class="w-full bg-dark/60 border border-border rounded-xl px-3 py-2 text-sm text-white focus:outline-none"

              placeholder="企业老板 / 运营主管"

            />

          </div>

          <div class="space-y-1.5">

            <label class="text-[11px] text-muted font-mono">视频目标</label>

            <select v-model="goal" class="w-full bg-dark/60 border border-border rounded-xl px-3 py-2 text-sm text-white focus:outline-none">

              <option v-for="item in GOAL_PRESETS" :key="item.id" :value="item.id">{{ item.label }}</option>

            </select>

          </div>

        </div>



        <div class="grid grid-cols-2 gap-3">

          <div class="space-y-1.5">

            <label class="text-[11px] text-muted font-mono">商业风格</label>

            <select v-model="videoStyle" class="w-full bg-dark/60 border border-border rounded-xl px-3 py-2 text-sm text-white focus:outline-none">

              <option v-for="item in COMMERCIAL_STYLE_PRESETS" :key="item.id" :value="item.id">{{ item.label }}</option>

            </select>

          </div>

          <div class="space-y-1.5">

            <label class="text-[11px] text-muted font-mono">内容风格</label>

            <select v-model="category" class="w-full bg-dark/60 border border-border rounded-xl px-3 py-2 text-sm text-white focus:outline-none">

              <option>科技干货</option>

              <option>专业干货 / 深度解析</option>

              <option>商业故事 / 案例拆解</option>

            </select>

          </div>

        </div>



        <div class="space-y-2">

          <label class="text-[11px] text-muted font-mono">画面比例</label>

          <div class="grid grid-cols-3 gap-2">

            <button

              v-for="r in (['9:16', '16:9', '1:1'] as VideoRatio[])"

              :key="r"

              type="button"

              class="py-2.5 rounded-xl border text-xs font-mono transition-all"

              :class="ratio === r ? 'bg-accent-blue/15 border-accent-blue text-accent-blue' : 'bg-dark/40 border-border text-muted'"

              @click="ratio = r"

            >

              {{ r }}

            </button>

          </div>

        </div>



        <div class="space-y-2">

          <label class="text-[11px] text-muted font-mono">目标时长</label>

          <div class="grid grid-cols-3 gap-2">

            <button

              v-for="d in [15, 30, 60]"

              :key="d"

              type="button"

              class="py-2.5 rounded-xl border text-xs transition-all"

              :class="duration === d ? 'bg-accent-blue/15 border-accent-blue text-accent-blue' : 'bg-dark/40 border-border text-muted'"

              @click="duration = d"

            >

              {{ d }} 秒

            </button>

          </div>

        </div>

      </div>



      <TemplatePicker @select="onTemplateSelect" />

      <div v-if="workspaceStore.templates.length" class="space-y-3">

        <div class="text-xs font-semibold text-muted uppercase tracking-wider">快速套用模板</div>

        <div class="flex gap-2 overflow-x-auto pb-1">

          <button

            v-for="tpl in workspaceStore.templates.slice(0, 4)"

            :key="tpl.id"

            type="button"

            class="shrink-0 px-3 py-2 rounded-xl glass-panel text-xs text-white hover:border-accent-purple/40 border border-transparent transition-colors"

            @click="applyTemplate(tpl)"

          >

            {{ tpl.tag }} {{ tpl.name }}

          </button>

        </div>

      </div>



      <button

        class="w-full h-12 btn-ai-gradient rounded-xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50"

        :disabled="submitting"

        @click="handleSubmit"

      >

        <Sparkles class="w-4 h-4" />

        ✨ AI 创建视频

        <ArrowRight class="w-4 h-4" />

      </button>

    </div>

  </div>

</template>

