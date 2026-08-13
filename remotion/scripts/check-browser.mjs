import { ensureBrowser } from '@remotion/renderer'

try {
  await ensureBrowser()
  process.stdout.write(JSON.stringify({ ok: true, message: 'Chromium ready' }))
} catch (error) {
  process.stdout.write(
    JSON.stringify({
      ok: false,
      message: error instanceof Error ? error.message : String(error),
    }),
  )
  process.exitCode = 1
}
