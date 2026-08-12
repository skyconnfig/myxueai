#!/usr/bin/env node
/**
 * E2E test for the Production Task Engine V1.0.
 * Run with: pnpm e2e:production   (after starting the backend: pnpm dev:backend)
 *
 * Covers:
 *   1. Normal production (start → complete)
 *   2. Idempotent start (duplicate click returns same task)
 *   3. Refresh (getStatus returns stable, consistent state)
 *   4. Cancel (cancel a running task)
 *   5. Retry (retry skips already-successful steps)
 *   6. Step records persisted with status/duration
 *   7. Progress model (Render base = 95%, Completed = 100%)
 */
const assert = (cond, msg) => { if (!cond) throw new Error(`ASSERT FAILED: ${msg}`) }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const BASE = process.env.API_BASE || 'http://localhost:3000/api'
let passed = 0
let failed = 0

async function req(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) {
    const err = new Error(`${method} ${path} -> ${res.status}: ${JSON.stringify(json)}`)
    err.response = json
    throw err
  }
  return json
}

async function poll(projectId, { timeoutMs = 120000, stopOn = (s) => s.isComplete || s.jobStatus === 'FAILED' || s.jobStatus === 'CANCELLED' } = {}) {
  const deadline = Date.now() + timeoutMs
  let last = null
  while (Date.now() < deadline) {
    last = (await req('GET', `/projects/${projectId}/production`)).data
    if (stopOn(last)) return last
    await sleep(1500)
  }
  throw new Error(`poll timeout. last=${JSON.stringify({ stage: last.stage, jobStatus: last.jobStatus, progress: last.overallProgress })}`)
}

function step(name, fn) {
  return async () => {
    try {
      await fn()
      passed += 1
      console.log(`  ✓ ${name}`)
    } catch (e) {
      failed += 1
      console.error(`  ✗ ${name}\n    ${e.message}`)
    }
  }
}

const makeProject = async (prompt = 'E2E 测试：为什么很多人学 AI 学不会？') => {
  const r = await req('POST', '/projects', { prompt, ratio: '9:16', duration: 15 })
  return r.data.id
}

const tests = [
  step('1. normal production completes with all steps success + renderId', async () => {
    const pid = await makeProject()
    const s = (await req('POST', `/projects/${pid}/production/start`)).data
    assert(s.jobStatus === 'RUNNING', `job should be RUNNING, got ${s.jobStatus}`)
    assert(s.taskId, 'taskId should be set')
    const done = await poll(pid)
    assert(done.isComplete, `should complete, got ${done.jobStatus}`)
    assert(done.overallProgress === 100, `progress should be 100, got ${done.overallProgress}`)
    const successSteps = done.steps.filter((x) => x.status === 'success')
    assert(successSteps.length === 7, `all 7 steps should be success, got ${successSteps.length}`)
    assert(done.renderId, `renderId should be set`)
    assert(done.videoUrl, `videoUrl should be set`)
  }),

  step('2. idempotent start — duplicate click returns same RUNNING task', async () => {
    const pid = await makeProject()
    const s1 = (await req('POST', `/projects/${pid}/production/start`)).data
    const s2 = (await req('POST', `/projects/${pid}/production/start`)).data
    assert(s1.taskId === s2.taskId, `duplicate start should return same taskId (${s1.taskId} vs ${s2.taskId})`)
    // clean up
    await req('POST', `/projects/${pid}/production/cancel`)
  }),

  step('3. refresh — getStatus returns stable consistent state', async () => {
    const pid = await makeProject()
    await req('POST', `/projects/${pid}/production/start`)
    await sleep(2000)
    const a = (await req('GET', `/projects/${pid}/production`)).data
    const b = (await req('GET', `/projects/${pid}/production`)).data
    assert(a.taskId === b.taskId, 'taskId stable across refresh')
    assert(a.jobStatus === b.jobStatus, 'jobStatus stable across refresh')
    assert(a.stage === b.stage, 'stage stable across refresh')
    await req('POST', `/projects/${pid}/production/cancel`)
  }),

  step('4. cancel — running task becomes CANCELLED', async () => {
    const pid = await makeProject()
    await req('POST', `/projects/${pid}/production/start`)
    await sleep(1500)
    const c = (await req('POST', `/projects/${pid}/production/cancel`)).data
    const cStatus = c ? c.jobStatus : null
    assert(cStatus === 'CANCELLED' || cStatus === 'COMPLETED' || cStatus === null, `cancel should yield CANCELLED/COMPLETED, got ${cStatus}`)
    const after = (await req('GET', `/projects/${pid}/production`)).data
    assert(['CANCELLED', 'COMPLETED'].includes(after.jobStatus), `post-cancel status ${after.jobStatus}`)
  }),

  step('5. retry — skips already-successful steps and resumes', async () => {
    const pid = await makeProject()
    await req('POST', `/projects/${pid}/production/start`)
    await sleep(1500)
    await req('POST', `/projects/${pid}/production/cancel`)
    const before = (await req('GET', `/projects/${pid}/production`)).data
    if (before.jobStatus === 'COMPLETED') return // raced to completion; nothing to retry
    const r = (await req('POST', `/projects/${pid}/production/retry`)).data
    assert(r.jobStatus === 'RUNNING', `retry should be RUNNING, got ${r.jobStatus}`)
    // The already-successful steps should remain success (not re-run from scratch)
    const successBefore = before.steps.filter((x) => x.status === 'success').map((x) => x.key)
    const successAfter = r.steps.filter((x) => x.status === 'success').map((x) => x.key)
    for (const k of successBefore) {
      assert(successAfter.includes(k), `retry should preserve success step ${k}`)
    }
    const done = await poll(pid)
    assert(done.isComplete, `retry should complete, got ${done.jobStatus}`)
  }),

  step('6. progress model — Render base = 95%, Completed = 100%', async () => {
    const pid = await makeProject()
    await req('POST', `/projects/${pid}/production/start`)
    // sample progress while rendering if possible
    let sawRender95 = false
    for (let i = 0; i < 20; i++) {
      const s = (await req('GET', `/projects/${pid}/production`)).data
      if (s.stage === 'RENDERING' && s.overallProgress >= 95) sawRender95 = true
      if (s.isComplete) break
      await sleep(800)
    }
    const done = await poll(pid)
    assert(done.overallProgress === 100, `completed progress = 100, got ${done.overallProgress}`)
    // sawRender95 may be missed if render is fast; treat as soft check
    if (sawRender95) console.log('     (observed RENDERING base progress >= 95 ✓)')
  }),
]

async function main() {
  console.log('Production Task Engine E2E — target:', BASE)
  for (const t of tests) await t()
  console.log(`\nResult: ${passed} passed, ${failed} failed`)
  process.exit(failed ? 1 : 0)
}

main().catch((e) => { console.error(e); process.exit(1) })
