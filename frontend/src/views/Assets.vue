<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useMessage } from 'naive-ui'
import { Film, Image as ImageIcon, Layers, Music, Search, Upload } from 'lucide-vue-next'
import type { AssetDto } from '@xueai/shared'
import { deleteAsset, fetchAssets, uploadAsset } from '@/api/asset'

const message = useMessage()
const fileInput = ref<HTMLInputElement | null>(null)

const assets = ref<AssetDto[]>([])
const loading = ref(true)
const uploading = ref(false)
const searchTerm = ref('')
const activeTab = ref<'all' | 'IMAGE' | 'AUDIO' | 'VIDEO'>('all')

const filtered = computed(() =>
  assets.value.filter((a) => {
    const title = (a.metadata?.originalName as string) ?? a.url
    const matchSearch = title.toLowerCase().includes(searchTerm.value.toLowerCase())
    const matchTab = activeTab.value === 'all' || a.type === activeTab.value
    return matchSearch && matchTab
  }),
)

const typeIcons = { IMAGE: ImageIcon, AUDIO: Music, VIDEO: Film }

async function loadAssets() {
  loading.value = true
  try {
    assets.value = await fetchAssets()
  } catch (err) {
    message.error(err instanceof Error ? err.message : '加载失败')
  } finally {
    loading.value = false
  }
}

function openUpload() {
  fileInput.value?.click()
}

async function onFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  uploading.value = true
  try {
    const asset = await uploadAsset(file, {
      projectId: 'library',
      type: file.type.startsWith('audio/') ? 'AUDIO' : file.type.startsWith('video/') ? 'VIDEO' : 'IMAGE',
    })
    assets.value.unshift(asset)
    message.success('上传成功')
  } catch (err) {
    message.error(err instanceof Error ? err.message : '上传失败')
  } finally {
    uploading.value = false
    input.value = ''
  }
}

async function handleDelete(id: string) {
  try {
    await deleteAsset(id)
    assets.value = assets.value.filter((a) => a.id !== id)
    message.success('已删除')
  } catch (err) {
    message.error(err instanceof Error ? err.message : '删除失败')
  }
}

function assetTitle(asset: AssetDto) {
  return (asset.metadata?.originalName as string) ?? asset.url.split('/').pop() ?? asset.id
}

onMounted(loadAssets)
</script>

<template>
  <div class="p-6 space-y-6 max-w-7xl mx-auto">
    <input ref="fileInput" type="file" class="hidden" accept="image/*,audio/*,video/*" @change="onFileChange" />

    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#2A303C] pb-4">
      <div>
        <h1 class="text-xl font-bold text-white flex items-center gap-2 m-0">
          <Layers class="w-5 h-5 text-[#2563EB]" />
          素材资产库
        </h1>
        <p class="text-xs text-[#A3A8B3] mt-0.5 mb-0">统一管理图片、音频、视频素材</p>
      </div>
      <button
        class="px-4 h-9 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 shrink-0 disabled:opacity-50"
        :disabled="uploading"
        @click="openUpload"
      >
        <Upload class="w-4 h-4" />
        {{ uploading ? '上传中...' : '上传新素材' }}
      </button>
    </div>

    <div class="bg-[#151922] p-4 border border-[#2A303C] rounded-xl space-y-3">
      <div class="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div class="flex items-center bg-[#1B202A] p-1 border border-[#2A303C] rounded-lg">
          <button
            v-for="tab in ([['all', '全部资产'], ['IMAGE', '图片/渲染'], ['AUDIO', '音频/BGM'], ['VIDEO', '视频片段']] as const)"
            :key="tab[0]"
            class="px-3 py-1.5 rounded text-xs transition-colors"
            :class="activeTab === tab[0] ? 'bg-[#2563EB] text-white font-medium' : 'text-[#A3A8B3] hover:text-white'"
            @click="activeTab = tab[0] as typeof activeTab"
          >
            {{ tab[1] }}
          </button>
        </div>
        <div class="relative w-full sm:w-64">
          <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A3A8B3]" />
          <input
            v-model="searchTerm"
            type="text"
            placeholder="搜索素材..."
            class="w-full bg-[#1B202A] border border-[#2A303C] rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-[#A3A8B3] focus:outline-none focus:border-[#2563EB]"
          />
        </div>
      </div>
    </div>

    <div v-if="loading" class="text-center text-muted py-12 text-sm">加载中...</div>
    <div v-else-if="!filtered.length" class="text-center text-muted py-12 text-sm">暂无素材，点击上传</div>

    <div v-else class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      <div
        v-for="asset in filtered"
        :key="asset.id"
        class="pro-card overflow-hidden group hover:border-[#2563EB]/50 transition-all"
      >
        <div class="aspect-square bg-[#0B0D10] flex items-center justify-center relative overflow-hidden">
          <img
            v-if="asset.type === 'IMAGE'"
            :src="asset.url"
            :alt="assetTitle(asset)"
            class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <component :is="typeIcons[asset.type] ?? ImageIcon" v-else class="w-8 h-8 text-[#2A303C]" />
          <span class="absolute top-2 left-2 px-1.5 py-0.5 bg-[#0B0D10]/80 border border-[#2A303C] text-[9px] font-mono text-[#A3A8B3] rounded">
            {{ asset.type }}
          </span>
          <button
            class="absolute top-2 right-2 px-1.5 py-0.5 bg-danger/80 text-white text-[9px] rounded opacity-0 group-hover:opacity-100"
            @click.stop="handleDelete(asset.id)"
          >
            删除
          </button>
        </div>
        <div class="p-3 space-y-1">
          <div class="text-xs font-medium text-white truncate">{{ assetTitle(asset) }}</div>
          <div class="text-[10px] text-[#A3A8B3] font-mono truncate">{{ asset.provider ?? 'local' }}</div>
        </div>
      </div>
    </div>
  </div>
</template>
