// Verifies the AI Director upgrade data flow:
//   DirectorPlan (with director blocks) → storyboard engine → cues.director
// Run: node --experimental-strip-types backend/scripts/verify-director-flow.mjs
import { register } from 'node:module'
import { pathToFileURL } from 'node:url'

// Use tsx-style transpile via the backend's existing tsconfig through a dynamic
// import of the compiled storyboard engine. We invoke tsc-emit-free by importing
// the source through tsx if available; otherwise fall back to a structural check.
const storyboard = await import('../src/modules/video-intelligence/storyboard.engine.ts')

const plan = {
  title: 'AI革命',
  style: 'tech',
  audience: '决策者',
  emotion: 'curiosity',
  storyStructure: [],
  scenes: [
    {
      purpose: 'hook',
      duration: 6,
      shotType: 'close_up',
      cameraMovement: 'push_in',
      lighting: 'neon practical lights',
      emotion: 'curiosity',
      visualDescription: 'cinematic close-up of a developer at a glowing screen',
      motionDescription: 'slow push-in',
      voiceover: 'AI正在改变未来',
      shot: { type: 'close', camera: 'push_in', speed: 0.5, intensity: 0.8 },
      visualLayer: {
        background: 'dim office with neon city lights through window',
        foreground: 'developer face lit by screen glow',
        overlay: 'soft bloom, dust particles, subtle film grain',
      },
      motion: { camera: 'slow push-in with handheld micro-shake', effect: 'light bloom on highlight' },
      audio: { sfx: 'impact' },
      captionStyle: { preset: 'tech', animation: 'spring', kinetic: true },
      assetRequirement: { role: 'illustration', type: 'ai-image' },
    },
  ],
}

const storyboardScenes = storyboard.storyboardEngine.buildStoryboardFromDirectorPlan(plan)
const payload = storyboard.storyboardEngine.storyboardToSceneCreatePayload(storyboardScenes)

const scene = payload[0]
const cues = scene.cues
console.log('=== AI Director upgrade — data flow verification ===\n')
console.log('soundEffect:', scene.soundEffect)
console.log('cues.director present:', Boolean(cues?.director))
console.log('cues.director.shot:', JSON.stringify(cues?.director?.shot))
console.log('cues.director.visualLayer:', JSON.stringify(cues?.director?.visualLayer))
console.log('cues.director.motion:', JSON.stringify(cues?.director?.motion))
console.log('cues.director.audio:', JSON.stringify(cues?.director?.audio))
console.log('cues.director.captionStyle:', JSON.stringify(cues?.director?.captionStyle))

const ok =
  scene.soundEffect === 'impact' &&
  Boolean(cues?.director?.shot) &&
  cues?.director?.shot?.camera === 'push_in' &&
  cues?.director?.visualLayer?.overlay?.includes('bloom') &&
  cues?.director?.captionStyle?.kinetic === true

console.log('\nRESULT:', ok ? 'PASS ✅ — director blocks flow through to cues.director' : 'FAIL ❌')
process.exit(ok ? 0 : 1)
