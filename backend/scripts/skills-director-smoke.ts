/**
 * Smoke test: Technology + Caption + Audio skills + Marketplace.
 * Usage: pnpm --filter backend skills:director
 */

import { generatePresetCinematicPlan } from '../src/modules/director/director.service.js'
import { agentPlanner } from '../src/modules/skills/agent-planner.js'
import { buildSkillPromptFragment } from '../src/modules/skills/skill-prompt.js'
import { enforceSkillRules } from '../src/modules/skills/skill-enforcer.js'
import { skillManager } from '../src/modules/skills/skill-manager.js'
import { skillMarketplaceService } from '../src/modules/skills/marketplace/skill-marketplace.service.js'

const TECH_SKILLS = ['style.technology', 'caption.kinetic-tech', 'audio.cinematic-tech']

async function testCategory(topic: string, expectedCategory: string, expectTech = false) {
  const agentPlan = await agentPlanner.plan({ topic, duration: 30, videoStyle: 'tech' })
  console.log(`\n[${expectedCategory}] topic: ${topic}`)
  console.log('  category:', agentPlan.category)
  if (agentPlan.category !== expectedCategory) {
    console.warn(`  ⚠ expected category ${expectedCategory}, got ${agentPlan.category}`)
  }
  console.log('  skills:', agentPlan.skills.join(', '))

  if (expectTech) {
    for (const id of TECH_SKILLS) {
      if (!agentPlan.skills.includes(id)) {
        throw new Error(`Missing tech skill: ${id}`)
      }
    }
    console.log('  ✓ Technology + Caption + Audio skills bound')
  }

  const leafIds = agentPlan.skills.filter((id) => skillManager.getSkill(id)?.kind !== 'bundle')
  const activeSkills = leafIds.map((id) => skillManager.getSkill(id)).filter(Boolean) as NonNullable<ReturnType<typeof skillManager.getSkill>>[]
  const bundle = skillManager.compose(leafIds)
  const fragment = buildSkillPromptFragment(bundle, activeSkills)
  console.log('  prompt chars:', fragment.length)

  if (expectedCategory === 'product_demo') {
    const preset = generatePresetCinematicPlan({ topic, duration: 30 })
    const enforced = enforceSkillRules(preset, activeSkills)
    const solution = enforced.scenes.find((s) => s.storyBeat === 'solution')
    if (solution?.componentType !== 'ProductDemoV2') {
      throw new Error(`Expected ProductDemoV2, got ${solution?.componentType}`)
    }
    if (solution?.captionStyle?.preset !== 'tech') {
      throw new Error(`Expected tech caption preset, got ${solution?.captionStyle?.preset}`)
    }
    console.log('  ✓ ProductDemoV2 + tech caption enforced')
  }
}

async function main() {
  await skillManager.load({ strict: true })

  console.log('Bundles:', skillManager.listBundles().map((b) => b.id).join(', '))
  console.log('Style skills:', skillManager.listSkills('style').map((s) => s.id).join(', '))

  const marketplace = await skillMarketplaceService.list({ featured: true })
  console.log('\nMarketplace featured:', marketplace.listings.filter((l) => l.featured).map((l) => l.id).join(', '))

  await testCategory('SaaS 工作流自动化产品演示', 'product_demo', true)
  await testCategory('帮我制作一个30秒AI Agent产品介绍视频', 'product_demo', true)
  await testCategory('做一个知识科普视频', 'education')
  await testCategory('制作品牌商业广告宣传片', 'advertisement', true)
  await testCategory('抖音爆款短视频15秒', 'viral_short')

  console.log('\nSkill OS: Agent + Skill + Scene Engine + Remotion — OK.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
