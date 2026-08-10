# XueAI Video Factory V1.0 专业 UI 改版设计规范

> 目标：从「AI 视频编辑器」升级为「AI 视频生产操作系统」，对标 Runway / Descript / CapCut Pro 工作台体验。

## 1. 设计原则

| 原则 | 说明 |
| --- | --- |
| 阶段引导 | 用户始终知道「我在哪一步、还剩几步」 |
| AI 优先 | 用户只负责想法，系统负责文案/分镜/素材/剪辑 |
| 故事时间线 | 降低 Premiere 式专业复杂度，用故事板语言 |
| 玻璃 + 渐变 | 暗色底 + 蓝紫渐变 + 轻玻璃态，强化 AI 产品感 |

## 2. Design Tokens

```css
--bg-dark: #0B0D10;
--bg-surface: #151922;
--bg-card: #1B202A;
--border-color: #2A303C;
--text-primary: #FFFFFF;
--text-muted: #A3A8B3;
--accent-blue: #3B82F6;
--accent-purple: #8B5CF6;
--accent-gradient: linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%);
--status-success: #22C55E;
--status-warning: #F59E0B;
--glass-bg: rgba(21, 25, 34, 0.72);
--glass-border: rgba(255, 255, 255, 0.08);
```

### 字体

| 层级 | 字号 | 用途 |
| --- | --- | --- |
| 页面标题 | 20px / font-bold | Studio 顶栏、模块主标题 |
| 模块标题 | 16px / font-semibold | 卡片标题 |
| 正文 | 14px | 描述、表单 |
| 辅助 | 12px | 标签、元数据 |
| Mono | 11px | 状态、技术信息 |

- 中文：`Noto Sans SC`
- 英文/数字：`Plus Jakarta Sans`

## 3. 页面结构（Studio）

```
┌─────────────────────────────────────────────────────────────┐
│ AppHeader — 项目 / Credits / AI任务 / 渲染                  │
├──────────┬──────────────────────────────────────────────────┤
│ Sidebar  │ CreationPipeline（6 步流程 + 当前高亮）            │
│ 分组导航  ├──────────┬─────────────────────┬─────────────────┤
│          │ AiCreate │ VideoPreviewStudio  │ AiDirectorPanel │
│          │ Panel    │ + AI 操作栏          │ AI 导演建议      │
│          ├──────────┴─────────────────────┴─────────────────┤
│          │ StoryTimeline（剧情时间线，非专业轨）              │
└──────────┴──────────────────────────────────────────────────┘
```

## 4. 组件清单

| 组件 | 路径 | 职责 |
| --- | --- | --- |
| CreationPipeline | `components/studio/CreationPipeline.vue` | 6 步创作流程引导 |
| AiCreatePanel | `components/studio/AiCreatePanel.vue` | AI 创建入口 + 分镜列表 |
| VideoPreviewStudio | `components/studio/VideoPreviewStudio.vue` | 预览 + 元信息 + AI 快捷操作 |
| AiDirectorPanel | `components/studio/AiDirectorPanel.vue` | AI 导演属性面板 |
| StoryTimeline | `components/studio/StoryTimeline.vue` | 故事化时间线 |

## 5. 文案规范（按钮）

| 旧文案 | 新文案 |
| --- | --- |
| 生成分镜 | ✨ AI 生成故事板 |
| 确认制作 | 🚀 开始渲染 |
| 替换画面 | 🎨 AI 重新生成 |
| 保存草稿 | 保存版本 |

## 6. 侧边栏分组

```
WORKSPACE
🎬 创作
   AI Studio ★
📂 内容资产
   素材库 / 模板库
🚀 发布
   分发中心
📊 数据
   生产统计
⚙ 系统
   设置
```

## 7. 实施阶段

### Phase 1 — 视觉（已完成基础）
- [x] Design tokens
- [x] 字体加载
- [x] 玻璃态 / 渐变按钮
- [x] 按钮文案升级

### Phase 2 — 体验
- [x] CreationPipeline
- [x] AiCreatePanel
- [x] VideoPreviewStudio
- [x] AiDirectorPanel
- [x] StoryTimeline

### Phase 3 — 商业化
- [x] Credits 展示（workspace API）
- [x] AI 任务队列（tasks API + 顶栏面板）
- [x] 模板市场（/templates 页面）
- [ ] 团队协作

## 8. Cursor 开发 Prompt 模板

```
按 docs/ui-redesign-v1.md 规范，重构 {组件名}：
1. 使用 CSS 变量，禁止硬编码旧色 #2563EB
2. 主 CTA 使用 btn-ai-gradient
3. 卡片使用 glass-panel
4. 保持现有 API/Store 逻辑不变
```
