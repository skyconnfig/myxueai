# XueAI Video Production OS — 架构路线图

> 参考 `skill/remotion-superpowers-main` 的 **video-director / post-producer / media-scout** 工作流思想，将 XueAI 从「AI 拼接器」升级为「AI 视频生产操作系统」。

## 现状 vs 目标

| 维度 | 当前 (V1.0) | 目标 (V1.3) |
|------|-------------|-------------|
| 策划 | 用户 prompt → 分镜 | **AI 导演** → 故事弧 → 镜头语言 → 素材需求 |
| 素材 | 100% AI 静帧 | **70% 真实素材** + 30% AI 增强 |
| 音频 | 配音 + BGM 占位 | **Voice / BGM / SFX** 三轨 + 闪避 |
| 合成 | Ken Burns + 转场 | 商业 Scene 系统 + spring 动效 |
| 质检 | 直接导出 | **AI 审片** → 评分 → 一键优化 → 重渲染 |

---

## 系统架构（目标态）

```
AI Video Production OS
├── AI Director Agent      ← video-director.md
├── Story Planner            ← DirectorBrief + story_arc
├── Scene Builder            ← 电影分镜 5 字段 + negative prompt
├── Asset Manager            ← AI 图 + 素材库 + Stock (Pexels)
├── Remotion Renderer        ← CinematicScene + AudioLayer
├── Audio Studio             ← Voice / BGM / SFX
├── AI Review Agent          ← post-producer.md
└── Publish Center
```

---

## 数据模型

### 已有（V1.0）

**Project** — `directorBrief`, `audience`, `goal`, `videoStyle`, `emotion`, `bgmCategory`, `bgmVolume`

**Scene** — `storyBeat`, `shotType`, `cameraMotion`, `lighting`, `emotion`, `action`, `negativePrompt`, `transition`, `sceneType`, `videoUrl`

**Asset** — `IMAGE | AUDIO | VIDEO | MUSIC`

### V1.2 计划新增

**VideoReview** — 审片记录

```sql
id, projectId, renderId, scores Json, issues Json, verdict, createdAt
```

**StockAsset** — 素材库索引（Pexels 等）

```sql
id, provider, externalId, url, previewUrl, duration, orientation, tags Json, license
```

---

## API 路由

| 方法 | 路径 | 模块 | 状态 |
|------|------|------|------|
| POST | `/api/ai/director` | 导演 Brief 预览 | ✅ |
| POST | `/api/ai/script` | 导演 + 分镜生成 | ✅ |
| POST | `/api/projects/:id/review` | AI 审片 | 🚧 V1.2 |
| GET | `/api/stock/search` | Pexels 素材搜索 | 🚧 V1.2 |
| POST | `/api/projects/:id/stock/attach` | 分镜绑定素材 | 📋 V1.3 |

---

## 生产流水线

### 前端展示（7 步）

① AI 导演 → ② 故事脚本 → ③ 电影分镜 → ④ 素材生成 → ⑤ 配音 → ⑥ 合成 → ⑦ 渲染

### 后端执行（对齐 superpowers 顺序）

```
Director Brief (Plan Studio)
  ↓
Script + Cinematic Scenes
  ↓
Stock Search (optional, V1.2)
  ↓
Image / Video Assets
  ↓
Voiceover (驱动时长)
  ↓
BGM + SFX (V1.1+)
  ↓
Compose timeline.json
  ↓
Remotion Render
  ↓
AI Review → Fix → Re-render (V1.2)
```

---

## 版本里程碑

### V1.1 — 导演 + 电影感（3 天）✅ 进行中

- [x] AI Director 两阶段 LLM（Brief → Scenes）
- [x] 电影分镜 5 字段 + negative prompt
- [x] Remotion Ken Burns + TransitionSeries
- [x] Director Brief 前端面板
- [x] BGM 预设 + render-input 透传
- [x] AudioLayer 闪避（配音时压低 BGM）
- [ ] 流水线 UI 与后端 task 键对齐

### V1.2 — 审片 + 素材（7 天）

- [ ] `review.service` — LLM 结构化评分（无 TwelveLabs 时可基于 metadata）
- [ ] TwelveLabs 视频理解（可选，`TWELVELABS_API_KEY`）
- [ ] Pexels 搜索 + 下载到 `storage/footage/`
- [ ] Remotion `<Video>` 播放 `scene.videoUrl`
- [ ] Production 页审片卡片 + 一键优化

### V1.3 — 商业级（15 天）

- [ ] AI 视频片段（Wan / Kling / Veo）
- [ ] SFX 生成 + 转场音效对齐
- [ ] Scene 组件库（Hook / Problem / Solution / CTA）
- [ ] spring() 动效 + 词级字幕
- [ ] Render → Review → Fix 自动循环

---

## 环境变量

```env
# 已有
LLM_API_KEY, TTS_API_KEY, OPENAI_API_KEY

# V1.2+
PEXELS_API_KEY=          # Media Scout
TWELVELABS_API_KEY=      # Post-Producer 视频理解
BGM_DEFAULT_URL=         # 默认 BGM（可选，覆盖预设）

# V1.3
REPLICATE_API_TOKEN=     # AI 视频片段
ELEVENLABS_API_KEY=      # SFX 生成
```

---

## Cursor 开发顺序（30 天）

| 周 | 任务 |
|----|------|
| W1 | V1.1 收尾：Brief UI、BGM、AudioLayer、文档 |
| W2 | V1.2：Review API + Production 审片 UI |
| W2 | V1.2：Pexels + scene.videoUrl + Remotion Video |
| W3 | V1.3：SFX 轨 + 转场音效 |
| W3 | V1.3：Scene 组件拆分 |
| W4 | V1.3：Review 自动修复循环 + 集成 xueai-video-skills QC |

---

## 参考

- `skill/remotion-superpowers-main/agents/video-director.md`
- `skill/remotion-superpowers-main/agents/post-producer.md`
- `skill/remotion-superpowers-main/agents/media-scout.md`
- `skill/remotion-superpowers-main/skills/remotion-production/rules/production-pipeline.md`
- `docs/video-json-schema.md`
