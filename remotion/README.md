# Remotion

独立 Remotion 项目，负责视频合成渲染。

## 输入

`RenderInput` JSON（见 `docs/video-json-schema.md`）

## 输出

MP4 文件 → `storage/renders/{renderId}/output.mp4`  
若 Remotion 未就绪，降级为 HTML 预览 → `preview.html`

## 结构

```
src/
├── index.ts
├── Root.tsx
├── compositions/VideoComposition.tsx
└── components/SceneSlide.tsx
scripts/
└── render.mjs          # 后端调用的渲染脚本
```

## 命令

```bash
cd remotion
pnpm dev                # Remotion Studio
pnpm render             # CLI 渲染
node scripts/render.mjs input.json output.mp4
```

> 首次 MP4 渲染需安装 Chromium（Remotion 自动下载）。开发环境可先用 HTML 预览降级。
