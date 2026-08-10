# Backend

Node.js + Express + TypeScript + Prisma API 服务。

## 快速开始

```bash
cd backend
cp .env.example .env
pnpm install
pnpm db:generate
pnpm db:migrate
pnpm db:seed
pnpm dev
```

- API: http://localhost:3000
- Health: http://localhost:3000/api/health
- Prisma Studio: `pnpm db:studio`

## 模块结构

```
src/
├── app.ts              # Express 应用
├── server.ts           # 启动入口
├── config/             # 环境变量、Prisma、Storage
├── middleware/         # 错误处理、校验
├── routes/             # 路由聚合
└── modules/
    ├── project/        # 项目 CRUD ✅
    ├── scene/          # 分镜 CRUD ✅
    ├── ai/             # LLM 脚本生成 ✅
    ├── task/           # 异步任务 ✅
    ├── production/     # 生产流水线 ✅
    ├── workspace/      # 积分 / 模板 ✅
    ├── video/          # 脚本接口 🟡
    ├── asset/          # 素材管理 ⏳
    └── render/         # Remotion 渲染 ⏳
```

## API 端点

| Method | Path | 说明 | 状态 |
|--------|------|------|------|
| GET | `/api/health` | 健康检查 | ✅ |
| GET/POST/DELETE | `/api/projects` | 项目 CRUD | ✅ |
| GET/POST | `/api/projects/:id/production` | 生产状态 / 启动 | ✅ |
| POST | `/api/ai/script` | AI 生成 VideoPlan | ✅ |
| GET/PUT/DELETE | `/api/scenes/:id` | 分镜管理 | ✅ |
| GET | `/api/tasks` | 任务列表 | ✅ |
| GET | `/api/workspace/summary` | 工作台摘要 | ✅ |
| GET | `/api/workspace/templates` | 视频模板 | ✅ |
| GET | `/api/assets` | 素材列表 | ⏳ |
| POST | `/api/render` | 启动渲染 | ⏳ |

## 开发进度

1. ✅ Express 架子 + Prisma 数据模型
2. ✅ Project CRUD 模块
3. ✅ AI Script Service（OpenAI 兼容）
4. ✅ Scene 模块
5. ✅ Task + Production 流水线（模拟进度）
6. ✅ Workspace（积分 / 模板）
7. ⏳ Asset 模块（图片 / 配音）
8. ⏳ Render 模块（Remotion 集成）
9. ⏳ WebSocket 实时推送
