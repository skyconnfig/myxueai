# API 文档

> MVP 阶段 API 规划，具体实现见各 backend module。

## Project

| Method | Path | 说明 |
|--------|------|------|
| POST | `/api/projects` | 创建项目 |
| GET | `/api/projects` | 项目列表 |
| GET | `/api/projects/:id` | 项目详情 |
| DELETE | `/api/projects/:id` | 删除项目 |

## AI

| Method | Path | 说明 |
|--------|------|------|
| POST | `/api/ai/script` | 生成 VideoPlan |
| POST | `/api/ai/image` | 生成图片素材 |
| POST | `/api/ai/voice` | 生成配音 |

## Scene

| Method | Path | 说明 |
|--------|------|------|
| GET | `/api/projects/:id/scenes` | 分镜列表 |
| PUT | `/api/scenes/:id` | 修改分镜 |
| DELETE | `/api/scenes/:id` | 删除分镜 |

## Render

| Method | Path | 说明 |
|--------|------|------|
| POST | `/api/render` | 启动渲染 `{ projectId }` |
| GET | `/api/render/:id` | 渲染状态 |

## WebSocket

| Path | 说明 |
|------|------|
| `/ws/projects/:id` | 任务进度实时推送 |

## 统一响应格式

```json
{
  "success": true,
  "data": {},
  "message": ""
}
```

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "..."
  }
}
```
