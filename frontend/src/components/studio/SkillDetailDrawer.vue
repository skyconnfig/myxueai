<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { NDrawer, NSpin, useMessage } from 'naive-ui'
import { Brain, Copy, Sparkles } from 'lucide-vue-next'
import type { SkillDefinition, SkillMarketplaceListing } from '@xueai/shared'
import { fetchSkillMarketplaceItem } from '@/api/skills'

const props = defineProps<{
  show: boolean
  listing: SkillMarketplaceListing | null
}>()

const emit = defineEmits<{
  'update:show': [value: boolean]
  use: [listing: SkillMarketplaceListing]
}>()

const message = useMessage()
const loading = ref(false)
const skill = ref<SkillDefinition | null>(null)
const yamlPreview = ref('')

const visible = computed({
  get: () => props.show,
  set: (value) => emit('update:show', value),
})

watch(
  () => [props.show, props.listing?.id] as const,
  async ([open, id]) => {
    if (!open || !id || !props.listing) {
      skill.value = null
      yamlPreview.value = ''
      return
    }
    loading.value = true
    try {
      const data = await fetchSkillMarketplaceItem(id)
      skill.value = data.skill
      yamlPreview.value = JSON.stringify(data.skill, null, 2)
    } catch (err) {
      message.error(err instanceof Error ? err.message : '加载 Skill 详情失败')
      yamlPreview.value = ''
    } finally {
      loading.value = false
    }
  },
  { immediate: true },
)

async function copyYaml() {
  if (!yamlPreview.value) return
  try {
    await navigator.clipboard.writeText(yamlPreview.value)
    message.success('已复制 Skill 定义')
  } catch {
    message.error('复制失败')
  }
}
</script>

<template>
  <NDrawer v-model:show="visible" :width="480" placement="right">
    <div class="h-full bg-surface text-white flex flex-col">
      <div class="p-5 border-b border-border space-y-2">
        <div class="flex items-center gap-2 text-accent-purple">
          <Brain class="w-5 h-5" />
          <span class="text-xs font-mono uppercase tracking-wider">Skill Detail</span>
        </div>
        <h2 class="text-lg font-bold m-0">{{ listing?.name }}</h2>
        <p class="text-xs font-mono text-muted m-0">{{ listing?.id }}</p>
        <p class="text-sm text-muted m-0">{{ listing?.summary ?? listing?.description }}</p>
      </div>

      <div class="flex-1 overflow-y-auto p-5 space-y-4">
        <NSpin :show="loading">
          <div v-if="skill" class="space-y-3">
            <div class="flex flex-wrap gap-2">
              <span class="text-[10px] px-2 py-0.5 rounded-lg bg-card border border-border font-mono">
                kind: {{ skill.kind }}
              </span>
              <span
                v-for="tag in listing?.tags.slice(0, 6) ?? []"
                :key="tag"
                class="text-[10px] px-2 py-0.5 rounded-lg bg-card border border-border text-muted"
              >
                {{ tag }}
              </span>
            </div>

            <div>
              <div class="flex items-center justify-between mb-2">
                <span class="text-xs font-semibold text-muted uppercase">Skill 定义 (JSON)</span>
                <button type="button" class="btn-soft !h-7 !px-2 !text-[10px]" @click="copyYaml">
                  <Copy class="w-3 h-3" />
                  复制
                </button>
              </div>
              <pre class="text-[10px] font-mono bg-dark border border-border rounded-xl p-3 overflow-x-auto m-0 leading-relaxed">{{ yamlPreview }}</pre>
            </div>
          </div>
        </NSpin>
      </div>

      <div class="p-5 border-t border-border flex gap-2">
        <button type="button" class="btn-soft flex-1 !h-10" @click="visible = false">关闭</button>
        <button
          v-if="listing"
          type="button"
          class="btn-soft btn-soft--primary flex-1 !h-10"
          @click="emit('use', listing); visible = false"
        >
          <Sparkles class="w-4 h-4" />
          使用此 Skill
        </button>
      </div>
    </div>
  </NDrawer>
</template>
