import type { ComposedSkillBundle, SkillDefinition } from '@xueai/shared'

function formatComponents(components: ComposedSkillBundle['components']): string {
  if (Array.isArray(components)) return components.join(', ')
  if (components && typeof components === 'object') {
    const req = (components as { required?: string[] }).required
    if (Array.isArray(req)) return req.join(', ')
    return JSON.stringify(components, null, 2)
  }
  return '(none)'
}

function formatSkillBlock(skill: SkillDefinition): string {
  const lines: string[] = [
    `### Skill: ${skill.id} (${skill.kind})`,
    skill.description,
    '',
    '**rules:**',
    '```json',
    JSON.stringify(skill.rules, null, 2),
    '```',
    '',
    '**components:**',
    formatComponents(skill.components),
  ]

  if (skill.examples.length) {
    lines.push('', '**example:**', '```json', JSON.stringify(skill.examples[0]?.output ?? {}, null, 2), '```')
  }

  return lines.join('\n')
}

/** Build mandatory skill rules section injected into Director LLM prompts. */
export function buildSkillPromptFragment(
  bundle: ComposedSkillBundle,
  skills: SkillDefinition[],
): string {
  if (skills.length === 0) return ''

  const blocks = skills.map(formatSkillBlock).join('\n\n')

  return `
== SKILL RULES（强制 — 不得违反，不得自由发挥镜头）==

你已绑定以下 Skill。输出必须严格遵守 Skill rules，禁止忽略或自行发明镜头语言。

激活 Skill IDs: ${bundle.skillIds.join(', ')}

${blocks}

== SKILL 合规要求（全局）==
1. **禁止自由生成镜头**：shot / cameraMotion / visualLayer 必须来自 Skill rules；若无明确 rule，使用该 Skill 所在 kind 的默认 rule。
2. **componentType 必须匹配 Skill components.renderer 或 require.componentType**。
3. **uiSteps**：若 Skill rules 含 uiSteps / uiStepsTemplate，solution/demo 镜必须原样输出等效步骤（至少包含 requiredActions）。
4. **uiSteps 优先使用 target 名称**（如 runButton, analytics, users），禁止只输出 x/y。
5. **productDemo 块**：若 Skill 要求 productDemo，必须输出 device / metric / simulator。
6. 违反任一 Skill rule 的 scene 视为无效输出。

`.trim()
}
