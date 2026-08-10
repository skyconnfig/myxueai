# Frontend

Vue 3 + TypeScript + Vite + Naive UI 工作台 UI。

## 已安装

- Vue Router / Pinia / Axios
- Naive UI / UnoCSS / Lucide Vue Next

## 页面

| 路由 | 页面 | 状态 |
|------|------|------|
| `/` | Dashboard | ✅ 已对接 workspace API |
| `/create` | CreateVideo | ✅ 已对接 project API |
| `/projects/:id/plan` | VideoPlan Studio | ✅ AI 方案 + 分镜编辑 + 预览 |
| `/projects/:id/production` | Production | ✅ 已对接 production API |
| `/projects/:id` | VideoDetail | ✅ 基础 UI |
| `/templates` | Templates | ✅ 已对接 templates API |
| `/assets` | Assets | ⏳ 占位 |
| `/settings` | Settings | ⏳ 占位 |

## Studio 组件

| 组件 | 说明 |
|------|------|
| `CreationPipeline` | 顶部创作流程步骤条 |
| `AiCreatePanel` | AI 脚本生成面板 |
| `AiDirectorPanel` | AI 导演指令面板 |
| `StoryTimeline` | 分镜时间轴 |
| `VideoPreviewStudio` | 视频预览播放器 |

## 开发

```bash
cd frontend
pnpm dev        # http://localhost:5173
pnpm typecheck
pnpm build
```

## UI 规范

- 背景: `#0B0F19`（Studio 暗色主题）
- 主色: `#111827`
- 强调: `#2563EB` / `#38BDF8`
- 字体: Inter + JetBrains Mono
