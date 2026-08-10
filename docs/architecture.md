# 架构说明

## 整体架构

```
Browser → Vue3 Frontend → Express API
                              ├── Prisma → SQLite
                              ├── AI Service → OpenAI Compatible API
                              └── Remotion → MP4 → storage/renders/
```

## 模块划分

### Backend Modules

| 模块 | 职责 | API 前缀 |
|------|------|----------|
| project | 项目 CRUD | `/api/projects` |
| video | 脚本 / 分镜 | `/api/projects/:id/script` |
| ai | LLM / 图片 / 配音 | `/api/ai/*` |
| asset | 素材管理 | `/api/assets` |
| task | 异步任务状态 | `/api/tasks` |
| render | Remotion 渲染 | `/api/render` |

### 分层结构

```
routes → controller → service → repository
                              → providers (ai 模块)
                              → remotion (render 模块)
```

## 数据流

1. `POST /api/projects` — 创建项目 (DRAFT)
2. `POST /api/ai/script` — 生成 VideoPlan → VideoScript + Scene[]
3. 用户确认分镜
4. `POST /api/ai/image` / `voice` — 生成素材 → Asset
5. `POST /api/render` — Remotion 渲染 → Render + MP4
6. `Project.status = COMPLETED`

## SaaS 升级路径

- 用户认证：`middleware/auth.ts` + JWT
- 对象存储：`config/storage.ts` 抽象 Local / S3
- 任务队列：`render.queue.ts` → BullMQ + Redis
- 数据库：SQLite → PostgreSQL + pgvector
