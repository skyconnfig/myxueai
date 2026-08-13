import fs from 'node:fs/promises'
import path from 'node:path'
import { parse as parseYaml } from 'yaml'
import {
  skillMarketplaceListingSchema,
  type SkillDefinition,
  type SkillKind,
  type SkillMarketplaceListing,
  type SkillMarketplaceMeta,
  type SkillMarketplaceTier,
} from '@xueai/shared'
import { skillManager } from '../skill-manager.js'
import { skillLoader } from '../manager/skill-loader.js'

export interface MarketplaceCatalog {
  version: string
  name: string
  description?: string
  featured: string[]
  categories: Array<{ id: string; name: string; skills: string[] }>
}

export interface MarketplaceQuery {
  tier?: SkillMarketplaceTier
  kind?: SkillKind
  category?: string
  featured?: boolean
  publicOnly?: boolean
  search?: string
}

function extractMarketplaceMeta(skill: SkillDefinition): SkillMarketplaceMeta | undefined {
  const raw = skill.rules.marketplace as SkillMarketplaceMeta | undefined
  if (!raw || typeof raw !== 'object') return undefined
  return raw
}

function skillOrigin(skill: SkillDefinition): SkillMarketplaceListing['origin'] {
  const source = skill.rules.source as string | undefined
  if (source === 'user_upload') return 'user'
  if (extractMarketplaceMeta(skill)?.tier === 'community') return 'marketplace'
  return 'builtin'
}

function toListing(skill: SkillDefinition, featuredIds: Set<string>): SkillMarketplaceListing {
  const meta = extractMarketplaceMeta(skill)
  const origin = skillOrigin(skill)
  return skillMarketplaceListingSchema.parse({
    id: skill.id,
    kind: skill.kind,
    name: skill.name,
    description: skill.description,
    version: skill.version,
    tier: meta?.tier ?? (origin === 'user' ? 'user' : 'official'),
    category: meta?.category,
    featured: meta?.featured ?? featuredIds.has(skill.id),
    public: meta?.public ?? origin !== 'user',
    author: meta?.author ?? (origin === 'user' ? 'Community' : 'XueAI'),
    installs: meta?.installs ?? 0,
    tags: meta?.tags ?? skill.trigger.tags ?? [],
    summary: meta?.summary ?? skill.description.slice(0, 120),
    origin,
  })
}

export class SkillMarketplaceService {
  private catalogCache: MarketplaceCatalog | null = null

  async loadCatalog(): Promise<MarketplaceCatalog> {
    if (this.catalogCache) return this.catalogCache
    const catalogPath = path.join(skillLoader.getDefaultRoot(), 'marketplace', 'catalog.yaml')
    try {
      const text = await fs.readFile(catalogPath, 'utf8')
      const raw = parseYaml(text) as MarketplaceCatalog
      this.catalogCache = {
        version: String(raw.version ?? '1.0.0'),
        name: raw.name ?? 'XueAI Skill Marketplace',
        description: raw.description,
        featured: raw.featured ?? [],
        categories: raw.categories ?? [],
      }
    } catch {
      this.catalogCache = {
        version: '1.0.0',
        name: 'XueAI Skill Marketplace',
        featured: [],
        categories: [],
      }
    }
    return this.catalogCache
  }

  async list(query: MarketplaceQuery = {}): Promise<{
    catalog: MarketplaceCatalog
    listings: SkillMarketplaceListing[]
    total: number
  }> {
    await skillManager.ensureLoaded({ strict: true })
    const catalog = await this.loadCatalog()
    const featuredIds = new Set(catalog.featured)

    let listings = skillManager.listSkills().map((s) => toListing(s, featuredIds))

    if (query.publicOnly !== false) {
      listings = listings.filter((l) => l.public || l.tier === 'official')
    }

    if (query.tier) listings = listings.filter((l) => l.tier === query.tier)
    if (query.kind) listings = listings.filter((l) => l.kind === query.kind)
    if (query.category) listings = listings.filter((l) => l.category === query.category)
    if (query.featured) listings = listings.filter((l) => l.featured)
    if (query.search) {
      const q = query.search.toLowerCase()
      listings = listings.filter(
        (l) =>
          l.name.toLowerCase().includes(q) ||
          l.description.toLowerCase().includes(q) ||
          l.tags.some((t) => t.toLowerCase().includes(q)),
      )
    }

    listings.sort((a, b) => {
      if (a.featured !== b.featured) return a.featured ? -1 : 1
      return a.name.localeCompare(b.name)
    })

    return { catalog, listings, total: listings.length }
  }

  async getListing(id: string): Promise<SkillMarketplaceListing | undefined> {
    await skillManager.ensureLoaded()
    const skill = skillManager.getSkill(id)
    if (!skill) return undefined
    const catalog = await this.loadCatalog()
    return toListing(skill, new Set(catalog.featured))
  }

  async listUserSkills(): Promise<SkillMarketplaceListing[]> {
    await skillManager.ensureLoaded()
    const catalog = await this.loadCatalog()
    return skillManager.listUserSkills().map((s) => toListing(s, new Set(catalog.featured)))
  }

  /** Attach marketplace metadata when user publishes a custom skill. */
  buildUserMarketplaceMeta(input: {
    public?: boolean
    summary?: string
    tags?: string[]
    author?: string
    category?: string
  }): SkillMarketplaceMeta {
    return {
      tier: 'user',
      public: input.public ?? true,
      author: input.author ?? 'Community',
      summary: input.summary,
      tags: input.tags,
      category: input.category ?? 'community',
      featured: false,
      installs: 0,
    }
  }
}

export const skillMarketplaceService = new SkillMarketplaceService()
