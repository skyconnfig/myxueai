// Standalone verification of ShotPlanner logic (mirrors ShotPlanner.ts).
const FRAMING_PROGRESSIONS = [
  ['establishing', 'medium', 'close', 'detail'],
  ['wide', 'medium', 'close', 'macro'],
  ['medium', 'close', 'medium', 'close'],
  ['close', 'medium', 'wide', 'close'],
]
const CAMERA_CYCLE = ['push_in', 'pan_right', 'pull_out', 'orbit', 'push_in', 'pan_left', 'parallax', 'handheld']
const FOCUS_POINTS = [
  { x: 0.5, y: 0.45 }, { x: 0.32, y: 0.4 }, { x: 0.68, y: 0.42 },
  { x: 0.5, y: 0.62 }, { x: 0.28, y: 0.55 }, { x: 0.72, y: 0.58 },
]
function seeded(seed) { const x = Math.sin(seed * 9999.7) * 43758.5453; return x - Math.floor(x) }
function plan(shot, durationInFrames, fps, seedBase) {
  const targetSec = durationInFrames / fps
  let count = Math.round(targetSec / 2.8); count = Math.max(1, Math.min(5, count))
  if (count === 1) return [{ index: 0, shotType: shot.type ?? 'medium', camera: shot.camera ?? 'push_in', focusPoint: FOCUS_POINTS[0], transitionIn: 'cut' }]
  const perShot = Math.floor(durationInFrames / count); const remainder = durationInFrames - perShot * count
  const prog = FRAMING_PROGRESSIONS[seedBase % FRAMING_PROGRESSIONS.length]
  const out = []; let cursor = 0
  for (let i = 0; i < count; i++) {
    const dur = perShot + (i < remainder ? 1 : 0)
    const shotType = i === 0 ? (shot.type ?? 'medium') : prog[(i + seedBase) % prog.length]
    const camera = i === 0 ? (shot.camera ?? 'push_in') : CAMERA_CYCLE[(i + seedBase) % CAMERA_CYCLE.length]
    const focusPoint = FOCUS_POINTS[(i + seedBase) % FOCUS_POINTS.length]
    let t = 'cut'
    if (i > 0) { const r = seeded(seedBase * 31 + i); if (r > 0.78) t = 'whip'; else if (r > 0.68) t = 'flash'; else if (r > 0.62) t = 'zoom_burst' }
    out.push({ index: i, startFrame: cursor, dur, shotType, camera, focusPoint, transitionIn: t }); cursor += dur
  }
  return out
}
const s1 = plan({ type: 'establishing', camera: 'push_in', intensity: 0.8 }, 150, 30, 1)
const s2 = plan({ type: 'close', camera: 'orbit', intensity: 0.7 }, 150, 30, 2)
console.log(`\nScene 1 (5s, establishing/push_in) -> ${s1.length} sub-shots:`)
s1.forEach(s => console.log(`  #${s.index} [${s.startFrame}-${s.startFrame + s.dur}f] ${s.shotType} / ${s.camera}  focus(${s.focusPoint.x},${s.focusPoint.y})  in:${s.transitionIn}`))
console.log(`\nScene 2 (5s, close/orbit) -> ${s2.length} sub-shots:`)
s2.forEach(s => console.log(`  #${s.index} [${s.startFrame}-${s.startFrame + s.dur}f] ${s.shotType} / ${s.camera}  focus(${s.focusPoint.x},${s.focusPoint.y})  in:${s.transitionIn}`))
console.log(`\nTotal sub-shots in 10s video: ${s1.length + s2.length} (each with different framing + camera + focus point)`)
