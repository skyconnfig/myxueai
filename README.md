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
| AI | api.xueai.me 网关（LLM / 配图 / speech-2.8-hd TTS） |
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

> 最后更新：2026-08-10（Plan Studio 配音 / 多音色 / 全屏预览）

### 阶段总览

| 阶段 | 内容 | 状态 |
|------|------|------|
| 1 | 项目骨架（Monorepo / 目录 / 文档） | ✅ 完成 |
| 2 | 前端初始化 + Studio UI 页面 | ✅ 完成 |
| 3 | 后端架子 + Prisma 数据模型 | ✅ 完成 |
| 4 | API 模块（Project → AI → Scene → Task → Production） | ✅ 完成 |
| 5 | Remotion 集成 + MP4 渲染 | ✅ 完成（Chromium + 素材 staging + AAC 音轨） |
| 6 | 用户认证 + WebSocket + Asset | ✅ 完成 |
| 7 | 真实 AI 配图 + 设置页（资料/登出） | ✅ 完成 |
| 8 | xueai 网关 TTS（speech-2.8-hd） | ✅ 完成 |
| 9 | Plan Studio 增强（配音预览 / 多音色 / 全屏 / AI 优化） | ✅ 完成 |
| 10 | 任务中心 + Dashboard 真实统计 + 项目删除 | ✅ 完成 |

### 前端页面

| 路由 | 页面 | 状态 |
|------|------|------|
| `/` | Dashboard 工作台 | ✅ 真实统计 + 项目删除 |
| `/create` | 创建视频 | ✅ 已对接 API + 任务中心入口 |
| `/projects/:id/plan` | AI 方案 Studio | ✅ 分镜编辑 + 配音试听 + 多音色 + 全屏预览 + AI 优化 |
| `/projects/:id/production` | 生产进度 | ✅ WebSocket 实时进度 + 6 步流水线 |
| `/projects/:id` | 视频详情 | ✅ MP4 预览 / 下载 |
| `/templates` | 模板市场 | ✅ 已对接 API |
| `/assets` | 素材库 | ✅ 已对接 API（上传/列表/删除） |
| `/settings` | 设置 | ✅ 资料编辑 / 登出 / AI 配置说明 |
| `/login` | 登录/注册 | ✅ JWT 认证 + Storyset 插画 |

### Plan Studio 能力（`/projects/:id/plan`）

| 功能 | 状态 | 说明 |
|------|------|------|
| AI 脚本生成 | ✅ | LLM 生成 VideoPlan + 分镜 |
| AI 脚本优化 | ✅ | 单镜 / 全部分镜口播与画面优化 |
| 分镜编辑 | ✅ | 标题 / 旁白 / 时长 / 画面 Prompt |
| 配音试听 | ✅ | 时间轴同步播放 TTS 音频 |
| 多音色配置 | ✅ | 8 种音色 + 5 种情绪，按分镜保存 |
| 重新配音 | ✅ | 一键重新生成当前项目配音 |
| 全屏预览 | ✅ | 双击或按钮进入，Esc 退出 |
| 生产流水线入口 | ✅ | 跳转 `/production` 一键生产 |

### 后端模块

| 模块 | 路由前缀 | 状态 |
|------|----------|------|
| Project | `/api/projects` | ✅ CRUD + 删除（自动停止流水线） |
| AI Script | `/api/ai/script` | ✅ LLM 生成 VideoPlan |
| AI Optimize | `/api/ai/optimize` | ✅ 分镜口播 / 画面优化 |
| Scene | `/api/scenes` | ✅ 分镜 CRUD（含 voiceId / voiceEmotion） |
| Task | `/api/tasks` | ✅ 创建 / 停止 / 删除 |
| Production | `/api/projects/:id/production` | ✅ 6 步流水线 + 重新配音 |
| Voice | `/api/voice/presets` | ✅ 音色 / 情绪预设列表 |
| Workspace | `/api/workspace` | ✅ 积分 / 模板 / 真实摘要统计 |
| Video | `/api/video` | 🟡 脚本接口 |
| Asset | `/api/assets` | ✅ CRUD + 网关配图/TTS 生成 |
| Render | `/api/render` | ✅ Remotion MP4 + HTML 预览降级 |
| Auth | `/api/auth` | ✅ 登录/注册/me/资料更新 |
| WebSocket | `/ws/projects/:id` | ✅ 生产进度推送 |

### 生产流水线（6 步）

```
① AI 脚本 → ② 自动分镜 → ③ 素材生成 → ④ 配音合成 → ⑤ 视频合成 → ⑥ 渲染导出
```

| 步骤 | 实现 | 说明 |
|------|------|------|
| 脚本 | ✅ | 分镜已在 Plan 页生成时标记完成 |
| 配图 | ✅ | z-image-turbo / 占位 SVG 降级 |
| 配音 | ✅ | speech-2.8-hd，支持分镜级音色与情绪 |
| 合成 | ✅ | 时间轴 / 字幕 / duration 同步 |
| 渲染 | ✅ | Remotion MP4（`enforceAudioTrack` 保留配音） |

### AI 生产说明

生产流水线在配置了 API Key 时使用真实服务，否则自动降级为占位素材。默认网关：`https://api.xueai.me/v1`

| 步骤 | 服务 | 环境变量 | 备注 |
|------|------|----------|------|
| 脚本 | OpenAI 兼容 LLM | `LLM_API_KEY` | 如 gpt-4o-mini |
| 分镜配图 | z-image-turbo / dall-e-3 | `OPENAI_API_KEY` | 网关兼容 OpenAI Images API |
| 配音 | speech-2.8-hd（Minimax 异步） | `LLM_API_KEY` 或 `TTS_API_KEY` | 约 25s/句，8 种中文音色 + 5 种情绪 |
| 配音（快） | tts-1 / gpt-4o-mini-tts | `TTS_MODEL=tts-1` | 同步，秒级返回 |
| 配音（可选） | ElevenLabs | `ELEVENLABS_API_KEY` | 优先级高于网关 |

### 待开发（P2）

| 功能 | 说明 |
|------|------|
| 改变风格 | Plan Studio Phase 3 按钮占位 |
| 自动剪辑 | 时间轴智能裁剪 |
| 修改字幕 | 字幕样式编辑器 |
| 成片页增强 | 多版本对比 / 社交发布 |
| Docker 一键部署 | 容器化 + 对象存储 + Postgres 迁移 |

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
# 编辑 backend/.env：LLM_API_KEY + LLM_BASE_URL=https://api.xueai.me/v1

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

---

## 生产部署

本节说明如何将 XueAI Video Factory 部署到 Linux 服务器（推荐 Ubuntu 22.04 LTS），实现「前端静态站点 + 后端 API + WebSocket + Remotion 渲染」一体化上线。

### 部署架构

```
                    ┌─────────────────────────────────────┐
  浏览器 ──HTTPS──► │ Nginx (:443)                        │
                    │  ├─ /          → frontend/dist 静态文件 │
                    │  ├─ /api       → 反代 backend:3000   │
                    │  ├─ /storage   → 反代 backend:3000   │
                    │  └─ /ws        → WebSocket 升级反代   │
                    └─────────────────────────────────────┘
                                        │
                    ┌───────────────────▼───────────────────┐
                    │ Node.js 后端 (:3000)                   │
                    │  Express API + WebSocket + 生产流水线  │
                    │  Remotion 渲染（Chromium headless）     │
                    └───────────────────┬───────────────────┘
                                        │
                    ┌───────────────────▼───────────────────┐
                    │ 持久化目录                              │
                    │  backend/prisma/prod.db  (SQLite)     │
                    │  storage/  (图片/音频/成片)              │
                    └───────────────────────────────────────┘
                                        │
                    ┌───────────────────▼───────────────────┐
                    │ 外部 AI 网关 api.xueai.me              │
                    │  LLM / 配图 / TTS                      │
                    └───────────────────────────────────────┘
```

### 服务器配置建议

| 场景 | CPU | 内存 | 磁盘 | 带宽 |
|------|-----|------|------|------|
| 开发/演示（1–2 并发渲染） | 2 核 | 4 GB | 40 GB SSD | 5 Mbps |
| 小规模生产（5 并发用户） | 4 核 | 8 GB | 100 GB SSD | 20 Mbps |
| 推荐生产（Remotion 渲染） | 8 核 | 16 GB | 200 GB SSD | 50 Mbps |

> **说明：** Remotion 渲染会启动 Chromium 逐帧合成 MP4，内存占用较高。并发渲染时建议将 `REMOTION_CONCURRENCY=1`，并通过 PM2 单实例或队列控制并发。

**操作系统：** Ubuntu 22.04 / 24.04 LTS（推荐）或同类 Linux 发行版。

**必需软件：**

| 软件 | 版本 | 用途 |
|------|------|------|
| Node.js | ≥ 20 LTS | 运行前后端与 Remotion |
| pnpm | ≥ 8 | Monorepo 依赖管理 |
| Git | 最新 | 拉取代码 |
| Nginx | 1.18+ | 反向代理 + 静态资源 |
| PM2 | 最新（推荐） | 进程守护 |
| Chromium 依赖库 | — | Remotion headless 渲染 |

**可选软件：**

| 软件 | 用途 |
|------|------|
| Certbot | 免费 HTTPS 证书（Let's Encrypt） |
| UFW | 防火墙 |

### 第一步：准备服务器

```bash
# 1. 更新系统
sudo apt update && sudo apt upgrade -y

# 2. 安装基础工具
sudo apt install -y git curl build-essential nginx

# 3. 安装 Node.js 20（NodeSource）
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# 4. 安装 pnpm
corepack enable
corepack prepare pnpm@latest --activate

# 5. 安装 PM2
sudo npm install -g pm2

# 6. 安装 Remotion/Chromium 所需系统库（Ubuntu）
sudo apt install -y \
  libnss3 libdbus-1-3 libatk1.0-0 libatk-bridge2.0-0 \
  libcups2 libdrm2 libxkbcommon0 libxcomposite1 libxdamage1 \
  libxfixes3 libxrandr2 libgbm1 libasound2 libpango-1.0-0 \
  libcairo2 libatspi2.0-0
```

### 第二步：拉取代码

```bash
# 创建部署目录
sudo mkdir -p /var/www/xueai
sudo chown $USER:$USER /var/www/xueai
cd /var/www/xueai

# 克隆仓库
git clone https://github.com/skyconnfig/myxueai.git .
# 或拉取最新：git pull origin main
```

### 第三步：安装依赖

```bash
cd /var/www/xueai

# 安装全部 workspace 依赖
pnpm install

# 若提示 Ignored build scripts，执行（允许 Prisma / esbuild 构建）：
pnpm approve-builds
# 勾选 @prisma/client、@prisma/engines、esbuild、prisma 后确认
# 然后重新安装：
pnpm install
```

### 第四步：配置环境变量

#### 4.1 后端 `backend/.env`

```bash
cp backend/.env.example backend/.env
nano backend/.env
```

**生产环境关键配置：**

```env
PORT=3000
NODE_ENV=production

# 数据库（生产建议使用独立路径）
DATABASE_URL="file:./prisma/prod.db"
STORAGE_PATH="../storage"

# 前端域名（CORS）
CORS_ORIGIN=https://your-domain.com

# AI 网关（必填）
LLM_API_KEY=sk-your-key
LLM_BASE_URL=https://api.xueai.me/v1
LLM_MODEL=gpt-4o-mini

OPENAI_API_KEY=sk-your-key
OPENAI_BASE_URL=https://api.xueai.me/v1
OPENAI_IMAGE_MODEL=z-image-turbo

TTS_MODEL=speech-2.8-hd
TTS_VOICE=Chinese (Mandarin)_Lyrical_Voice

# 认证（务必修改）
JWT_SECRET=请替换为至少32位随机字符串
JWT_EXPIRES_IN=7d

# Remotion 渲染
REMOTION_CRF=18
REMOTION_CONCURRENCY=1
REMOTION_CHROMIUM_HEADLESS=true
REMOTION_PUBLIC_URL=https://your-domain.com
```

#### 4.2 前端 `frontend/.env.production`

```bash
nano frontend/.env.production
```

```env
# 与 Nginx 同域部署时使用相对路径（推荐）
VITE_API_BASE_URL=/api
VITE_WS_URL=
```

> 若前后端不同域，改为完整地址，例如 `VITE_API_BASE_URL=https://api.your-domain.com/api`、`VITE_WS_URL=wss://api.your-domain.com/ws`。

### 第五步：初始化数据库

```bash
cd /var/www/xueai/backend

# 生成 Prisma Client
pnpm db:generate

# 生产环境执行迁移（不要用 db:migrate，那是开发命令）
npx prisma migrate deploy

# 可选：写入演示数据
pnpm db:seed
```

### 第六步：安装 Remotion Chromium

```bash
cd /var/www/xueai

# 首次部署必须执行，下载 headless Chromium
pnpm remotion:browser
```

### 第七步：构建前端

```bash
cd /var/www/xueai

# 构建 Vue 前端 → frontend/dist/
pnpm --filter frontend build
```

验证：确认存在 `frontend/dist/index.html`。

### 第八步：启动后端

MVP 阶段 `@xueai/shared` 为 TypeScript 源码，生产环境推荐使用 `tsx` 直接运行：

```bash
cd /var/www/xueai/backend

# 手动测试启动
NODE_ENV=production npx tsx src/server.ts
```

另开终端验证：

```bash
curl http://127.0.0.1:3000/api/health
# 应返回 {"success":true,"data":{"status":"ok",...}}
```

**使用 PM2 守护（推荐）：**

```bash
cd /var/www/xueai/backend

pm2 start "npx tsx src/server.ts" \
  --name xueai-api \
  --cwd /var/www/xueai/backend

# 保存 PM2 配置并设置开机自启
pm2 save
pm2 startup
```

或使用 ecosystem 文件 `/var/www/xueai/ecosystem.config.cjs`：

```javascript
module.exports = {
  apps: [
    {
      name: 'xueai-api',
      cwd: '/var/www/xueai/backend',
      script: 'npx',
      args: 'tsx src/server.ts',
      env: {
        NODE_ENV: 'production',
      },
      instances: 1,
      autorestart: true,
      max_memory_restart: '2G',
    },
  ],
}
```

```bash
pm2 start ecosystem.config.cjs
pm2 save
```

### 第九步：配置 Nginx

```bash
sudo nano /etc/nginx/sites-available/xueai
```

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # 前端静态文件
    root /var/www/xueai/frontend/dist;
    index index.html;

    client_max_body_size 50m;

    # Vue Router history 模式
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API 反代
    location /api/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 300s;
    }

    # 素材/成片静态文件（由后端 storage 提供）
    location /storage/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        expires 7d;
    }

    # WebSocket 生产进度推送
    location /ws/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_read_timeout 86400s;
    }
}
```

```bash
sudo ln -sf /etc/nginx/sites-available/xueai /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 第十步：配置 HTTPS（推荐）

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

Certbot 会自动修改 Nginx 配置并启用 443 端口。

### 第十一步：防火墙

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
sudo ufw status
```

> 只需对外开放 80/443，**不要**将 3000 端口暴露到公网。

### 第十二步：验证部署

| 检查项 | 命令/操作 | 期望结果 |
|--------|-----------|----------|
| 后端健康 | `curl http://127.0.0.1:3000/api/health` | `status: ok` |
| 前端页面 | 浏览器打开 `https://your-domain.com` | 显示 Dashboard |
| 登录 | `demo@xueai.local` / `demo123456` | 登录成功 |
| API 反代 | 浏览器 Network 查看 `/api/workspace/summary` | 200 |
| WebSocket | 进入生产页 `/projects/:id/production` | 无 WS 连接错误 |
| 渲染 | 完成一次生产流水线 | 生成 MP4 并可下载 |

### 更新部署（发版流程）

```bash
cd /var/www/xueai
git pull origin main
pnpm install
cd backend && npx prisma migrate deploy && cd ..
pnpm remotion:browser          # Remotion 升级后建议重跑
pnpm --filter frontend build
pm2 restart xueai-api
sudo systemctl reload nginx
```

### 目录与权限

确保以下目录可写（运行后端的用户需有写权限）：

```bash
mkdir -p /var/www/xueai/storage/{uploads,images,audio,renders,compose,temp}
mkdir -p /var/www/xueai/backend/prisma
chmod -R 755 /var/www/xueai/storage
```

| 路径 | 说明 |
|------|------|
| `backend/prisma/prod.db` | SQLite 数据库 |
| `storage/images/` | AI 生成配图 |
| `storage/audio/` | TTS 配音文件 |
| `storage/renders/` | Remotion 渲染成片 |
| `frontend/dist/` | 前端构建产物 |

### 生产环境变量完整清单

| 变量 | 必填 | 说明 |
|------|------|------|
| `PORT` | 否 | 后端端口，默认 3000 |
| `NODE_ENV` | 是 | 设为 `production` |
| `DATABASE_URL` | 是 | SQLite 路径，如 `file:./prisma/prod.db` |
| `STORAGE_PATH` | 否 | 存储根目录，默认 `../storage` |
| `CORS_ORIGIN` | 是 | 前端域名，如 `https://your-domain.com` |
| `LLM_API_KEY` | 是 | AI 脚本 / TTS 网关密钥 |
| `LLM_BASE_URL` | 否 | 默认 `https://api.xueai.me/v1` |
| `LLM_MODEL` | 否 | 脚本模型 |
| `OPENAI_API_KEY` | 是* | 配图密钥（可与 LLM 相同） |
| `OPENAI_IMAGE_MODEL` | 否 | 推荐 `z-image-turbo` |
| `TTS_MODEL` | 否 | 默认 `speech-2.8-hd` |
| `JWT_SECRET` | 是 | 生产环境必须改为强随机值 |
| `REMOTION_PUBLIC_URL` | 是 | 公网访问地址，渲染资源 URL 用 |
| `REMOTION_CONCURRENCY` | 否 | 并行帧数，低配服务器设 1 |
| `VITE_API_BASE_URL` | 是 | 前端 API 前缀，同域用 `/api` |
| `VITE_WS_URL` | 否 | 同域留空，自动走 `/ws` |

### 常见问题

**1. 生产页 `/production` 报 500**

- 检查后端是否运行：`pm2 status`
- 检查 Nginx 反代：`curl http://127.0.0.1:3000/api/health`
- 查看日志：`pm2 logs xueai-api`

**2. WebSocket 连接失败**

- 确认 Nginx 已配置 `/ws/` 的 `Upgrade` 头
- 同域部署时 `frontend/.env.production` 中 `VITE_WS_URL` 留空
- HTTPS 站点需使用 `wss://`（Nginx 反代自动处理）

**3. Remotion 渲染失败 / 无 MP4**

- 确认已执行 `pnpm remotion:browser`
- 检查 Chromium 系统依赖是否安装完整
- 查看 PM2 日志中的 `[render] Remotion render failed` 详情
- 低配机器保持 `REMOTION_CONCURRENCY=1`

**4. 配音/配图返回占位内容**

- 检查 `LLM_API_KEY` / `OPENAI_API_KEY` 是否配置
- 确认服务器能访问 `https://api.xueai.me`

**5. Windows 开发环境 `pnpm dev:backend` 失败**

- 使用 `cd backend && npx tsx src/server.ts` 代替
- 或执行 `pnpm approve-builds` 后重试 `pnpm install`

---

## 环境变量

复制 `backend/.env.example` 为 `backend/.env`。

| 变量 | 说明 |
|------|------|
| `LLM_API_KEY` | LLM / TTS 网关密钥（必填） |
| `LLM_BASE_URL` | 网关地址，默认 `https://api.xueai.me/v1` |
| `LLM_MODEL` | 脚本模型，如 `gpt-4o-mini` |
| `OPENAI_API_KEY` | 配图密钥（可与 LLM 相同） |
| `OPENAI_BASE_URL` | 配图网关地址 |
| `OPENAI_IMAGE_MODEL` | 图片模型，推荐 `z-image-turbo` |
| `TTS_MODEL` | 配音模型，默认 `speech-2.8-hd` |
| `TTS_VOICE` | Minimax 音色，如 `Chinese (Mandarin)_Lyrical_Voice` |
| `TTS_LANGUAGE_BOOST` | 语言增强，默认 `Chinese` |
| `ELEVENLABS_API_KEY` | ElevenLabs 配音（可选，优先于网关） |
| `DATABASE_URL` | SQLite 路径 |
| `JWT_SECRET` | JWT 签名密钥 |
| `REMOTION_CRF` | Remotion 视频质量 |

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
