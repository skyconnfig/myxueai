/**
 * Validate all skills under repo skills/ directory.
 * Usage: pnpm --filter backend skills:validate
 */

import { skillManager } from '../src/modules/skills/skill-manager.js'
import { skillComposer } from '../src/modules/skills/skill-composer.js'

async function main() {
  const registry = await skillManager.load({ strict: true })
  const failed = registry.loadResults.filter((r) => !r.ok)

  console.log(`Skills root: ${registry.rootDir}`)
  console.log(`Loaded: ${registry.skills.length} valid skill(s)`)

  for (const skill of registry.skills) {
    console.log(`  ✓ [${skill.kind}] ${skill.id} — ${skill.name}`)
  }

  if (failed.length) {
    console.error('\nValidation errors:')
    for (const r of failed) {
      console.error(`  ✗ ${r.sourcePath}`)
      for (const e of r.errors) console.error(`      ${e.path}: ${e.message}`)
    }
    process.exit(1)
  }

  const composed = skillComposer.composeAll(registry.skills)
  console.log(`\nCompose all (${composed.skillIds.length} skills):`)
  console.log(`  kinds: ${composed.kinds.join(', ')}`)
  console.log(`  rules keys: ${Object.keys(composed.rules).join(', ')}`)
  console.log(`  parameters: ${Object.keys(composed.parameters).length}`)
  console.log(`  examples: ${composed.examples.length}`)

  const matched = skillManager.match({ text: '开场 hook 推镜', tags: ['opening'] })
  console.log(`\nMatch "开场 hook 推镜": ${matched.map((s) => s.id).join(', ') || '(none)'}`)

  const bundle = skillManager.matchAndCompose(
    { text: '开场 hook 推镜', tags: ['opening', 'camera'] },
    { mergeStrategy: 'deep-merge' },
  )
  console.log(`Match+compose: ${bundle.skillIds.join(', ')}`)

  console.log('\nAll skills valid.')
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err)
  process.exit(1)
})
