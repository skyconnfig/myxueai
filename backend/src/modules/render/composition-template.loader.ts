import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { CompositionTemplateJSON } from '@xueai/shared'
import { AppError } from '../../middleware/error-handler.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const templatesRoot = path.resolve(__dirname, '../../../../remotion/templates')

const cache = new Map<string, CompositionTemplateJSON>()

function validateTemplate(raw: unknown, slug: string): CompositionTemplateJSON {
  const data = raw as CompositionTemplateJSON
  if (!data?.slug || !data.sceneBlueprint?.length) {
    throw new AppError(500, 'INVALID_COMPOSITION_TEMPLATE', `Invalid composition template: ${slug}`)
  }
  return data
}

export function loadCompositionTemplate(slug: string): CompositionTemplateJSON {
  const cached = cache.get(slug)
  if (cached) return cached

  const filePath = path.join(templatesRoot, slug, 'template.json')
  if (!fs.existsSync(filePath)) {
    throw new AppError(404, 'COMPOSITION_TEMPLATE_NOT_FOUND', `Composition template not found: ${slug}`)
  }

  const template = validateTemplate(JSON.parse(fs.readFileSync(filePath, 'utf8')), slug)
  cache.set(slug, template)
  return template
}

export function listCompositionTemplateSlugs(): string[] {
  if (!fs.existsSync(templatesRoot)) return []
  return fs
    .readdirSync(templatesRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .filter((entry) => fs.existsSync(path.join(templatesRoot, entry.name, 'template.json')))
    .map((entry) => entry.name)
}

export const compositionTemplateLoader = {
  load: loadCompositionTemplate,
  listSlugs: listCompositionTemplateSlugs,
}
