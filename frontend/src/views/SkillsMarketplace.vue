<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { NInput, NModal, NSelect, NTabPane, NTabs, useMessage } from 'naive-ui'
import {
  ArrowRight,
  Brain,
  Layers,
  Plus,
  Search,
  Sparkles,
  Trash2,
  Upload,
  Wand2,
  Zap,
} from 'lucide-vue-next'
import type { SkillMarketplaceListing } from '@xueai/shared'
import {
  deleteSkill,
  fetchSkillMarketplace,
  fetchUserSkills,
  loadSelectedSkillIds,
  matchSkills,
  saveSelectedSkillIds,
  toggleSelectedSkillId,
  uploadSkillPackage,
} from '@/api/skills'
import SkillDetailDrawer from '@/components/studio/SkillDetailDrawer.vue'

const router = useRouter()
const message = useMessage()

const loading = ref(true)
const tab = ref('official')
const search = ref('')
const categoryFilter = ref<string | null>(null)
const listings = ref<SkillMarketplaceListing[]>([])
const userListings = ref<SkillMarketplaceListing[]>([])
const catalogName = ref('XueAI Skill Marketplace')
const categories = ref<Array<{ id: string; name: string; skills: string[] }>>([])
const selectedIds = ref<string[]>(loadSelectedSkillIds())

const matchText = ref('')
const matchResult = ref<string[]>([])
const matching = ref(false)

const showUpload = ref(false)
const showDetail = ref(false)
const detailListing = ref<SkillMarketplaceListing | null>(null)
const uploadAuthor = ref('')
const uploadSummary = ref('')
const uploading = ref(false)
const packageLabel = ref('')
const packageFiles = ref<File[]>([])
const packageArchive = ref<File | null>(null)
const uploadResult = ref<{ installedIds: string[]; errors: Array<{ path: string; message: string }> } | null>(null)
const zipInputRef = ref<HTMLInputElement | null>(null)
const folderInputRef = ref<HTMLInputElement | null>(null)
const dragActive = ref(false)

const categoryOptions = computed(() =>
  categories.value.map((c) => ({ label: c.name, value: c.id })),
)

const filteredListings = computed(() => {
  let list = listings.value
  if (categoryFilter.value) {
    list = list.filter((l) => l.category === categoryFilter.value)
  }
  if (search.value.trim()) {
    const q = search.value.trim().toLowerCase()
    list = list.filter(
      (l) =>
        l.name.toLowerCase().includes(q) ||
        l.description.toLowerCase().includes(q) ||
        l.tags.some((t) => t.toLowerCase().includes(q)),
    )
  }
  return list
})

const tierLabel: Record<string, string> = {
  official: '官方',
  community: '社区',
  user: '用户',
}

const kindLabel: Record<string, string> = {
  bundle: 'Bundle',
  style: '风格',
  caption: '字幕',
  audio: '音频',
  scene: '场景',
  camera: '镜头',
  hook: 'Hook',
  template: '模板',
  platform: '平台',
}

function kindColor(kind: string) {
  const map: Record<string, string> = {
    bundle: 'text-accent-purple',
    style: 'text-accent-blue',
    caption: 'text-emerald-400',
    audio: 'text-amber-400',
  }
  return map[kind] ?? 'text-muted'
}

async function loadOfficial() {
  const data = await fetchSkillMarketplace()
  listings.value = data.listings
  catalogName.value = data.catalog.name
  categories.value = data.catalog.categories
}

async function loadUser() {
  const data = await fetchUserSkills()
  userListings.value = data.listings
}

onMounted(async () => {
  loading.value = true
  try {
    await Promise.all([loadOfficial(), loadUser()])
  } catch (err) {
    message.error(err instanceof Error ? err.message : '加载 Skill 市场失败')
  } finally {
    loading.value = false
  }
})

function isSelected(id: string) {
  return selectedIds.value.includes(id)
}

function toggleSelect(id: string) {
  selectedIds.value = toggleSelectedSkillId(id)
}

function useSkill(item: SkillMarketplaceListing) {
  if (!isSelected(item.id)) {
    selectedIds.value = toggleSelectedSkillId(item.id)
  }
  router.push({
    name: 'create-video',
    query: {
      skill: item.id,
      prompt: promptForSkill(item),
    },
  })
}

function promptForSkill(item: SkillMarketplaceListing): string {
  if (item.id.includes('product-demo')) return '制作一个 SaaS 产品演示视频'
  if (item.id.includes('education')) return '做一个知识科普视频'
  if (item.id.includes('advertisement')) return '制作品牌商业广告宣传片'
  if (item.id.includes('viral-short')) return '做一个抖音爆款短视频'
  if (item.id.includes('tech-documentary')) return 'AI 技术深度纪录片'
  return `使用 ${item.name} 制作视频`
}

function openDetail(item: SkillMarketplaceListing) {
  detailListing.value = item
  showDetail.value = true
}

function goCreateWithSelected() {
  if (!selectedIds.value.length) {
    message.warning('请先选择至少一个 Skill')
    return
  }
  saveSelectedSkillIds(selectedIds.value)
  router.push({ name: 'create-video', query: { skills: selectedIds.value.join(',') } })
}

async function runMatch() {
  if (!matchText.value.trim()) return
  matching.value = true
  try {
    const res = await matchSkills({ text: matchText.value.trim(), userSkillIds: selectedIds.value })
    matchResult.value = res.skills
    message.success(`匹配到 ${res.skills.length} 个 Skill`)
  } catch (err) {
    message.error(err instanceof Error ? err.message : '匹配失败')
  } finally {
    matching.value = false
  }
}

function resetUploadState() {
  uploadAuthor.value = ''
  uploadSummary.value = ''
  packageLabel.value = ''
  packageFiles.value = []
  packageArchive.value = null
  uploadResult.value = null
  dragActive.value = false
  if (zipInputRef.value) zipInputRef.value.value = ''
  if (folderInputRef.value) folderInputRef.value.value = ''
}

function openUploadModal() {
  resetUploadState()
  showUpload.value = true
}

function setArchive(file: File) {
  packageArchive.value = file
  packageFiles.value = []
  packageLabel.value = file.name
  uploadResult.value = null
}

function setFolderFiles(files: FileList | File[]) {
  const list = Array.from(files)
  packageFiles.value = list
  packageArchive.value = null
  const first = list[0] as File & { webkitRelativePath?: string }
  const root = first?.webkitRelativePath?.split('/')[0]
  packageLabel.value = root ? `文件夹：${root}（${list.length} 个文件）` : `文件夹（${list.length} 个文件）`
  uploadResult.value = null
}

function onZipPick(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (file) setArchive(file)
}

function onFolderPick(event: Event) {
  const input = event.target as HTMLInputElement
  if (input.files?.length) setFolderFiles(input.files)
}

function onDrop(event: DragEvent) {
  dragActive.value = false
  const file = event.dataTransfer?.files?.[0]
  if (!file) return
  if (file.name.toLowerCase().endsWith('.zip')) {
    setArchive(file)
    return
  }
  message.warning('请将 Skill 文件夹打包为 ZIP 后拖拽上传，或使用「选择文件夹」')
}

async function handleUpload() {
  if (!packageArchive.value && !packageFiles.value.length) {
    message.warning('请选择 ZIP 压缩包或 Skill 文件夹')
    return
  }
  uploading.value = true
  uploadResult.value = null
  try {
    const result = await uploadSkillPackage({
      archive: packageArchive.value ?? undefined,
      files: packageFiles.value.length ? packageFiles.value : undefined,
      author: uploadAuthor.value || undefined,
      summary: uploadSummary.value || undefined,
    })
    uploadResult.value = {
      installedIds: result.installedIds,
      errors: result.errors,
    }
    message.success(`已安装 ${result.total} 个 Skill`)
    await loadUser()
    tab.value = 'mine'
    if (!result.errors.length) {
      showUpload.value = false
      resetUploadState()
    }
  } catch (err) {
    message.error(err instanceof Error ? err.message : '安装失败')
  } finally {
    uploading.value = false
  }
}

async function removeUserSkill(id: string) {
  try {
    await deleteSkill(id)
    message.success('已删除')
    selectedIds.value = selectedIds.value.filter((x) => x !== id)
    saveSelectedSkillIds(selectedIds.value)
    await loadUser()
  } catch (err) {
    message.error(err instanceof Error ? err.message : '删除失败')
  }
}
</script>

<template>
  <div class="p-6 space-y-6 max-w-7xl mx-auto">
    <div class="glass-panel p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
      <div>
        <div class="flex items-center gap-2 mb-2">
          <Brain class="w-4 h-4 text-accent-blue" />
          <span class="text-xs text-muted">Skill OS · Agent 能力市场</span>
        </div>
        <h1 class="text-xl font-bold text-white m-0">{{ catalogName }}</h1>
        <p class="text-sm text-muted m-0 mt-1">
          Agent + Skill + Scene Engine + Remotion — 选择专业视频制作能力
        </p>
      </div>
      <div class="flex flex-wrap gap-2 shrink-0">
        <button
          class="btn-soft px-4 py-2 rounded-xl text-sm flex items-center gap-2"
          @click="openUploadModal"
        >
          <Upload class="w-4 h-4" />
          上传 Skill
        </button>
        <button
          class="btn-ai-gradient px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2"
          :disabled="!selectedIds.length"
          @click="goCreateWithSelected"
        >
          <Sparkles class="w-4 h-4" />
          使用已选 ({{ selectedIds.length }})
        </button>
      </div>
    </div>

    <div class="glass-panel p-4 space-y-3">
      <div class="flex items-center gap-2 text-xs text-muted">
        <Wand2 class="w-3.5 h-3.5" />
        Skill 匹配预览
      </div>
      <div class="flex flex-col md:flex-row gap-2">
        <NInput
          v-model:value="matchText"
          placeholder="输入：制作 AI 软件介绍视频 / 知识科普 / 品牌广告..."
          class="flex-1"
        />
        <button
          class="btn-soft--primary px-4 py-2 rounded-xl text-sm shrink-0 flex items-center justify-center gap-2"
          :disabled="matching"
          @click="runMatch"
        >
          <Zap class="w-4 h-4" />
          {{ matching ? '匹配中...' : '智能匹配' }}
        </button>
      </div>
      <div v-if="matchResult.length" class="flex flex-wrap gap-2">
        <span
          v-for="id in matchResult"
          :key="id"
          class="px-2 py-1 rounded-lg text-[11px] font-mono bg-card border border-border text-accent-blue"
        >
          {{ id }}
        </span>
      </div>
    </div>

    <div class="flex flex-col md:flex-row gap-3">
      <div class="relative flex-1">
        <Search class="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          v-model="search"
          class="w-full pl-10 pr-4 py-2.5 rounded-xl bg-card border border-border text-sm text-white outline-none focus:border-accent-blue/50"
          placeholder="搜索 Skill..."
        />
      </div>
      <NSelect
        v-model:value="categoryFilter"
        :options="categoryOptions"
        clearable
        placeholder="分类筛选"
        class="w-full md:w-48"
      />
    </div>

    <NTabs v-model:value="tab" type="line" animated>
      <NTabPane name="official" tab="官方 Skill">
        <div v-if="loading" class="text-center py-16 text-muted text-sm">加载中...</div>
        <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div
            v-for="item in filteredListings"
            :key="item.id"
            class="glass-panel p-4 hover:border-accent-blue/40 transition-all cursor-pointer group"
            :class="isSelected(item.id) ? 'border-accent-blue/60 ring-1 ring-accent-blue/30' : ''"
            @click="toggleSelect(item.id)"
          >
            <div class="flex items-start justify-between gap-2 mb-3">
              <div>
                <div class="flex items-center gap-2 mb-1">
                  <span class="text-[10px] font-mono px-2 py-0.5 rounded-lg bg-card border border-border" :class="kindColor(item.kind)">
                    {{ kindLabel[item.kind] ?? item.kind }}
                  </span>
                  <span v-if="item.featured" class="text-[10px] text-accent-purple">精选</span>
                </div>
                <h3 class="text-base font-semibold text-white m-0">{{ item.name }}</h3>
              </div>
              <span class="text-[10px] font-mono text-muted shrink-0">{{ tierLabel[item.tier] ?? item.tier }}</span>
            </div>
            <p class="text-xs text-muted m-0 line-clamp-2 min-h-[2.5rem]">{{ item.summary ?? item.description }}</p>
            <div class="flex flex-wrap gap-1 mt-3">
              <span
                v-for="tag in item.tags.slice(0, 4)"
                :key="tag"
                class="text-[10px] px-1.5 py-0.5 rounded bg-card border border-border text-muted"
              >
                {{ tag }}
              </span>
            </div>
            <div class="flex gap-2 mt-4">
              <button
                class="flex-1 py-2 rounded-lg text-xs font-medium bg-card border border-border text-white hover:border-accent-blue/50 flex items-center justify-center gap-1.5"
                @click.stop="useSkill(item)"
              >
                使用 Skill
                <ArrowRight class="w-3.5 h-3.5" />
              </button>
              <button
                class="px-3 py-2 rounded-lg text-xs border border-border text-muted hover:text-white"
                @click.stop="openDetail(item)"
              >
                详情
              </button>
              <button
                class="px-3 py-2 rounded-lg text-xs border border-border"
                :class="isSelected(item.id) ? 'text-accent-blue border-accent-blue/50' : 'text-muted'"
                @click.stop="toggleSelect(item.id)"
              >
                <Plus class="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </NTabPane>

      <NTabPane name="mine" tab="我的 Skill">
        <div v-if="!userListings.length" class="text-center py-16 text-muted text-sm space-y-3">
          <Layers class="w-8 h-8 mx-auto opacity-40" />
          <p class="m-0">暂无用户 Skill，点击「上传 Skill」发布自定义能力</p>
        </div>
        <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div
            v-for="item in userListings"
            :key="item.id"
            class="glass-panel p-4 hover:border-accent-purple/40 transition-all"
          >
            <div class="flex items-start justify-between gap-2 mb-2">
              <h3 class="text-base font-semibold text-white m-0">{{ item.name }}</h3>
              <button class="text-muted hover:text-red-400 p-1" @click="removeUserSkill(item.id)">
                <Trash2 class="w-4 h-4" />
              </button>
            </div>
            <p class="text-xs font-mono text-muted m-0 mb-2">{{ item.id }}</p>
            <p class="text-xs text-muted m-0 line-clamp-2">{{ item.summary ?? item.description }}</p>
            <button
              class="w-full mt-4 py-2 rounded-lg text-xs font-medium bg-card border border-border text-white hover:border-accent-purple/50"
              @click="useSkill(item)"
            >
              使用此 Skill
            </button>
          </div>
        </div>
      </NTabPane>
    </NTabs>

    <NModal v-model:show="showUpload" preset="card" title="上传 Skill 包" class="max-w-2xl">
      <div class="space-y-4">
        <p class="text-xs text-muted m-0">
          支持 ZIP 压缩包或 Skill 文件夹，系统会自动识别包内的 YAML/JSON Skill 定义并安装。
        </p>

        <div
          class="rounded-xl border border-dashed p-6 text-center transition-colors"
          :class="dragActive ? 'border-accent-blue bg-accent-blue/5' : 'border-border bg-card/40'"
          @dragover.prevent="dragActive = true"
          @dragleave.prevent="dragActive = false"
          @drop.prevent="onDrop"
        >
          <Upload class="w-8 h-8 mx-auto text-muted mb-3" />
          <p class="text-sm text-white m-0 mb-1">拖拽 ZIP 到此处，或选择上传方式</p>
          <p class="text-[11px] text-muted m-0 mb-4">自动扫描 .yaml / .yml / .json Skill 定义并安装</p>
          <div class="flex flex-wrap justify-center gap-2">
            <button
              type="button"
              class="btn-soft px-4 py-2 rounded-lg text-xs"
              @click="zipInputRef?.click()"
            >
              选择 ZIP
            </button>
            <button
              type="button"
              class="btn-soft px-4 py-2 rounded-lg text-xs"
              @click="folderInputRef?.click()"
            >
              选择文件夹
            </button>
          </div>
          <input
            ref="zipInputRef"
            type="file"
            accept=".zip,application/zip"
            class="hidden"
            @change="onZipPick"
          />
          <input
            ref="folderInputRef"
            type="file"
            class="hidden"
            webkitdirectory
            directory
            multiple
            @change="onFolderPick"
          />
        </div>

        <div
          v-if="packageLabel"
          class="rounded-lg border border-border bg-card px-3 py-2 text-xs text-white flex items-center justify-between gap-2"
        >
          <span class="truncate">{{ packageLabel }}</span>
          <button type="button" class="text-muted hover:text-white shrink-0" @click="resetUploadState">
            清除
          </button>
        </div>

        <NInput v-model:value="uploadAuthor" placeholder="作者名（可选）" />
        <NInput v-model:value="uploadSummary" placeholder="简介（可选）" />

        <div v-if="uploadResult" class="rounded-lg border border-border bg-card p-3 space-y-2">
          <p class="text-xs text-success m-0">已安装：{{ uploadResult.installedIds.join(', ') }}</p>
          <div v-if="uploadResult.errors.length" class="space-y-1">
            <p class="text-xs text-warning m-0">部分文件未识别为 Skill：</p>
            <p
              v-for="item in uploadResult.errors.slice(0, 5)"
              :key="item.path"
              class="text-[10px] text-muted m-0 font-mono"
            >
              {{ item.path }} — {{ item.message }}
            </p>
          </div>
        </div>

        <button
          class="btn-ai-gradient w-full py-2.5 rounded-xl text-sm font-semibold"
          :disabled="uploading || (!packageArchive && !packageFiles.length)"
          @click="handleUpload"
        >
          {{ uploading ? '识别并安装中...' : '验证并安装' }}
        </button>
      </div>
    </NModal>

    <SkillDetailDrawer v-model:show="showDetail" :listing="detailListing" @use="useSkill" />
  </div>
</template>
