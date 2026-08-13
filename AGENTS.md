# AGENTS.md

XueAI Video Factory — AI short-video production platform. Monorepo (pnpm workspaces): `frontend` (Vue 3 + Vite + Naive UI + UnoCSS), `backend` (Express + Prisma + SQLite), `remotion` (React/Remotion 4 MP4 renderer), `shared` (`@xueai/shared` types). All API docs, UI copy, and code comments are in Chinese.

## Commands

- Install: `pnpm install` (then `pnpm approve-builds` if Prisma/esbuild build scripts are ignored)
- Dev servers: `pnpm dev:frontend` (:5173, proxies `/api` `/storage` `/ws` → :3000) and `pnpm dev:backend` (:3000). `pnpm dev:remotion` runs Remotion Studio.
- DB init (from `backend/`): `pnpm db:generate && pnpm db:migrate && pnpm db:seed` — required before the backend runs. `db:push` is also available.
- **Verification: there is NO linter.** The root `pnpm lint` (`pnpm -r lint`) fails because no package defines a `lint` script. Use `pnpm -r typecheck` (runs shared/backend/frontend) or per-package `pnpm --filter <pkg> typecheck`. Remotion has no typecheck script; verify it via `pnpm --filter remotion build` (bundles via `remotion bundle src/index.ts`).
- Build: `pnpm build` → `pnpm -r build`. `shared` has no build script (it is consumed as TS source directly).
- Remotion render requires Chromium: `pnpm remotion:browser` (also runs via remotion `postinstall`).
- E2E smoke scripts: `pnpm --filter backend e2e:saas-demo` / `e2e:production`; `pnpm --filter remotion render:fixture`.
- Windows: `pnpm dev:backend` (`tsx watch`) can fail — fallback is `cd backend && npx tsx src/server.ts`.

## Architecture

- **`shared/` is the source of truth** for all render/type contracts (`RenderInput`, `VideoCompositionJSON`, voice presets, etc.). It is consumed directly from `./src/index.ts` (no build). New shared files must be exported from `shared/src/index.ts`.
- **Backend** uses ESM + NodeNext: every relative import ends in `.js` (even for `.ts` files). Backend runs via `tsx` in dev and production (`NODE_ENV=production npx tsx src/server.ts`); `pnpm build` compiles to `dist/`.
- Backend module layout: `src/modules/<name>/` with `routes.ts → controller → service → repository`. AI client lives in `src/lib/ai/` (DeepSeek, OpenAI-compatible). Routes mounted from `src/routes/index.ts`; static `/storage` served from `storage/`.
- **Production pipeline** (`backend/src/modules/production/production.service.ts`): Director → Script → Storyboard → Asset → TTS → Timeline → Render. Progress is pushed over WebSocket at `/ws/projects/:id`. Interrupted jobs are resumed on boot (`recoverOnBoot`).
- **Render flow**: backend builds a `RenderInput`, stages media from `storage/` into `remotion/public/renders/{renderId}/` (for `staticFile()`), then spawns `node remotion/scripts/render.mjs <input.json> <output.mp4>`. Progress lines `XUEAI_PROGRESS:n` are parsed from stdout. If Remotion fails, it falls back to an HTML preview (no MP4). Cleanup of staged assets happens after render.
- **Remotion** entry: `remotion/src/index.ts` → `Root.tsx` registers a single composition `id="VideoComposition"`. `RenderInput.composition` (a `VideoCompositionJSON`) is preferred over legacy `RenderInput.scenes` fields by the video engine. Scene components are registered via the purpose registry (`video-engine/scenes/`) at import time. Studio default props come from `src/fixtures/studio-saas-demo.ts`; CLI fixtures live in `remotion/fixtures/*.json`.

## Env & gotchas

- Env file: `backend/.env` (copy from `backend/.env.example`). Frontend uses `frontend/.env.development` (`VITE_API_BASE_URL=/api`, `VITE_WS_URL=ws://localhost:3000/ws`).
- LLM is DeepSeek V4 Flash via `OPENAI_API_KEY` (default base URL `https://api.deepseek.com`). `LLM_*` vars are legacy fallback used only when `OPENAI_API_KEY` is empty. Without keys, AI features degrade to preset templates / placeholders (`source: preset`) instead of erroring.
- TTS: `TTS_API_KEY` → xueai gateway `speech-2.8-hd` (async, ~25s/sentence); `TTS_MODEL=tts-1` switches to a fast sync path. ElevenLabs (`ELEVENLABS_API_KEY`) takes priority when set.
- Demo user auto-created in dev: `demo@xueai.local` / `demo123456`. SQLite DB is `backend/prisma/dev.db` (gitignored); production uses `backend/prisma/prod.db` via `npx prisma migrate deploy`.
- Storage root is `../storage` relative to backend (subdirs: uploads, images, audio, renders, compose, temp, footage). Renders land in `storage/renders/{renderId}/output.mp4`.
- `skill/`, `docs/`, and `plan/` are reference material, not app code — the skill packs reference an external `D:\video\...` workflow, not this repo. `docs/video-json-schema.md` and `docs/architecture.md` document the render contract.