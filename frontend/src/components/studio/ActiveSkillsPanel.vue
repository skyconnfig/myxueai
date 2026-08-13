<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { Brain, Plus } from 'lucide-vue-next'
import { usePreferences } from '@/composables/usePreferences'

const props = defineProps<{
  skillIds: string[]
  agentCategory?: string | null
}>()

const router = useRouter()
const { t } = usePreferences()

const displaySkills = computed(() => [...new Set(props.skillIds.filter(Boolean))])
</script>

<template>
  <div class="px-4 pb-4 border-b border-border space-y-2">
    <div class="flex items-center justify-between gap-2">
      <div class="flex items-center gap-2">
        <Brain class="w-4 h-4 text-accent-purple" />
        <h3 class="text-sm font-semibold text-white m-0">{{ t('plan.active_skills') }}</h3>
      </div>
      <button
        type="button"
        class="btn-soft !h-7 !px-2 !text-[10px] !rounded-lg"
        @click="router.push({ name: 'skills-marketplace' })"
      >
        <Plus class="w-3 h-3 text-accent-blue" />
        管理
      </button>
    </div>

    <p v-if="agentCategory" class="text-[10px] text-muted font-mono m-0">
      Agent 分类 · {{ agentCategory }}
    </p>

    <div v-if="displaySkills.length" class="flex flex-wrap gap-1.5">
      <span
        v-for="id in displaySkills"
        :key="id"
        class="px-2 py-1 bg-card border border-border rounded-md text-[10px] font-mono text-white/90"
      >
        {{ id }}
      </span>
    </div>
    <p v-else class="text-xs text-muted m-0 leading-relaxed">
      {{ t('plan.no_skills') }}
    </p>
  </div>
</template>
