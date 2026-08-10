# XueAI Video Factory MVP

> 输入一句话，AI 自动生成短视频。

[![GitHub](https://img.shields.io/badge/GitHub-skyconnfig%2Fmyxueai-181717?logo=github)](https://github.com/skyconnfig/myxueai)

## 产品流程

```
用户输入需求 → AI 视频方案 → 分镜编辑 → 一键生产 → 素材/配音/合成 → Remotion 渲染 → MP4
```

## 技术栈

| 层 | 技术 |
|----|------|
| 前端 | Vue 3 + TypeScript + Vite + Naive UI + Pinia + UnoCSS |
| 后端 | Node.js + Express + TypeScript + Prisma |
| 数据库 | SQLite |
| 视频 | Remotion 4.x + Chromium |
| AI | LLM 脚本 + OpenAI DALL·E 3 配图 + ElevenLabs TTS |
| 存储 | 本地 `storage/` |

## 项目结构

```
xueai-video-factory/
├── frontend/     # Vue3 工作台 UI
├── backend/      # Express API + 业务逻辑
├── remotion/     # 视频渲染引擎（MP4 输出）
├── shared/       # 前后端共享类型
├── storage/      # 本地文件存储
├── docs/         # 设计文档
└── scripts/      # 开发脚本
```

## 开发进度

> 最后更新：2026-08-10

### 阶段总览

| 阶段 | 内容 | 状态 |
|------|------|------|
| 1 | 项目骨架（Monorepo / 目录 / 文档） | ✅ 完成 |
| 2 | 前端初始化 + Studio UI 页面 | ✅ 完成 |
| 3 | 后端架子 + Prisma 数据模型 | ✅ 完成 |
| 4 | API 模块（Project → AI → Scene → Task → Production） | ✅ 完成 |
| 5 | Remotion 集成 + MP4 渲染 | ✅ 完成（Chromium + 素材 staging） |
| 6 | 用户认证 + WebSocket + Asset | ✅ 完成 |
| 7 | 真实 AI 配图/配音 + 设置页 | ✅ 完成 |

### 前端页面

| 路由 | 页面 | 状态 |
|------|------|------|
| `/` | Dashboard 工作台 | ✅ 已对接 API |
| `/create` | 创建视频 | ✅ 已对接 API |
| `/projects/:id/plan` | AI 方案 Studio | ✅ Studio UI + 分镜编辑 |
| `/projects/:id/production` | 生产进度 | ✅ WebSocket 实时进度 |
| `/projects/:id` | 视频详情 | ✅ 基础 UI |
| `/templates` | 模板市场 | ✅ 已对接 API |
| `/assets` | 素材库 | ✅ 已对接 API（上传/列表/删除） |
| `/settings` | 设置 | ✅ 资料编辑 / 登出 / AI 配置说明 |
| `/login` | 登录/注册 | ✅ JWT 认证 + Storyset 插画 |

### 后端模块

| 模块 | 路由前缀 | 状态 |
|------|----------|------|
| Project | `/api/projects` | ✅ CRUD |
| AI Script | `/api/ai/script` | ✅ LLM 生成 VideoPlan |
| Scene | `/api/scenes` | ✅ 分镜 CRUD |
| Task | `/api/tasks` | ✅ 任务状态管理 |
| Production | `/api/projects/:id/production` | ✅ 5 步流水线（真实 AI + 渲染） |
| Workspace | `/api/workspace` | ✅ 积分 / 模板 / 摘要 |
| Video | `/api/video` | 🟡 脚本接口 |
| Asset | `/api/assets` | ✅ CRUD + OpenAI/ElevenLabs 生成 |
| Render | `/api/render` | ✅ Remotion MP4 + HTML 预览降级 |
| Auth | `/api/auth` | ✅ 登录/注册/me/资料更新 |
| WebSocket | `/ws/projects/:id` | ✅ 生产进度推送 |

### AI 生产说明

生产流水线在配置了 API Key 时使用真实服务，否则自动降级为占位素材：

| 步骤 | 服务 | 环境变量 |
|------|------|----------|
| 分镜配图 | OpenAI DALL·E 3 | `OPENAI_API_KEY` |
| 配音 | ElevenLabs TTS | `ELEVENLABS_API_KEY` |
| 脚本 | OpenAI 兼容 LLM | `LLM_API_KEY` |

### Remotion MP4 渲染

首次渲染前需安装 Chromium（`pnpm remotion:browser`）。渲染脚本会将素材复制到 `remotion/public/renders/{id}/` 供 `staticFile()` 使用。

| 变量 | 说明 | 默认 |
|------|------|------|
| `REMOTION_CRF` | 视频质量（越小越清晰） | 18 |
| `REMOTION_CONCURRENCY` | 并行帧数 | 1 |
| `REMOTION_CHROMIUM_HEADLESS` | 无头模式 | true |

## 快速开始

```bash
# 安装依赖
pnpm install

# 配置环境变量
cp backend/.env.example backend/.env
# 编辑 backend/.env：LLM_API_KEY（必填），可选 OPENAI_API_KEY / ELEVENLABS_API_KEY

# 初始化数据库
cd backend
pnpm db:generate
pnpm db:migrate
pnpm db:seed
cd ..

# 安装 Remotion Chromium（首次 MP4 渲染前）
pnpm remotion:browser

# 启动开发环境
pnpm dev:backend    # http://localhost:3000
pnpm dev:frontend   # http://localhost:5173
```

验证 API：`GET http://localhost:3000/api/health`

Demo 账号：`demo@xueai.local` / `demo123456`

## 环境变量

复制 `backend/.env.example` 为 `backend/.env`。

| 变量 | 说明 |
|------|------|
| `LLM_API_KEY` | LLM API 密钥（必填，AI 脚本生成） |
| `LLM_BASE_URL` | OpenAI 兼容接口地址 |
| `LLM_MODEL` | 模型名称 |
| `OPENAI_API_KEY` | DALL·E 3 分镜配图（可选） |
| `OPENAI_IMAGE_MODEL` | 图片模型，默认 `dall-e-3` |
| `ELEVENLABS_API_KEY` | ElevenLabs TTS 配音（可选） |
| `ELEVENLABS_VOICE_ID` | 默认音色 ID |
| `DATABASE_URL` | SQLite 路径 |
| `JWT_SECRET` | JWT 签名密钥 |
| `JWT_EXPIRES_IN` | Token 有效期，默认 7d |
| `REMOTION_CRF` | Remotion 视频质量 |
| `REMOTION_CONCURRENCY` | Remotion 并行度 |

## 文档

- [架构说明](./docs/architecture.md)
- [API 规划](./docs/api.md)
- [Video JSON Schema](./docs/video-json-schema.md)
- [UI 设计规范 v1](./docs/ui-redesign-v1.md)

## 开发规范

- TypeScript 严格模式
- 每次只开发一个模块
- 模块化分层：Controller → Service → Repository
- UI 风格：Linear / Notion / Canva 商业 SaaS 风
