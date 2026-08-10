<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { fetchVideoTemplates, type DbVideoTemplate } from '@/api/template'

const emit = defineEmits<{
  select: [template: DbVideoTemplate]
}>()

const templates = ref<DbVideoTemplate[]>([])
const loading = ref(true)
const selectedSlug = ref<string | null>(null)

onMounted(async () => {
  try {
    templates.value = await fetchVideoTemplates()
  } catch {
    templates.value = []
  } finally {
    loading.value = false
  }
})

function pick(tpl: DbVideoTemplate) {
  selectedSlug.value = tpl.slug
  emit('select', tpl)
}
</script>

<template>
  <div class="space-y-3">
    <div class="text-xs font-semibold text-muted uppercase tracking-wider">商业视频模板</div>
    <div v-if="loading" class="text-xs text-muted py-4 text-center">加载模板...</div>
    <div v-else-if="!templates.length" class="text-xs text-muted py-4 text-center">暂无模板</div>
    <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-2">
      <button
        v-for="tpl in templates"
        :key="tpl.slug"
        type="button"
        class="text-left p-3 rounded-xl border transition-all"
        :class="
          selectedSlug === tpl.slug
            ? 'border-accent-purple/50 bg-accent-purple/10'
            : 'glass-panel border-transparent hover:border-accent-purple/30'
        "
        @click="pick(tpl)"
      >
        <div class="text-xs font-semibold text-white">{{ tpl.name }}</div>
        <div class="text-[10px] text-muted mt-1 font-mono">
          {{ tpl.duration }}s · {{ tpl.ratio }} · {{ tpl.scenes?.length ?? 0 }} 镜
        </div>
        <div class="text-[10px] text-accent-blue mt-1">{{ tpl.category }}</div>
      </button>
    </div>
  </div>
</template>
