/**
 * Restore acceptance project from storage/_voice_test.json snapshot
 * and seed images from an existing project with files on disk.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { prisma } from '../src/config/database.js'
import { authService } from '../src/modules/auth/auth.service.js'
import { assetRepository } from '../src/modules/asset/asset.repository.js'
import { AssetType } from '../src/constants/status.js'
import { productionService } from '../src/modules/production/production.service.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const storageRoot = path.resolve(__dirname, '../../storage')
const snapshotPath = path.join(storageRoot, '_voice_test.json')
const IMAGE_DONOR_PROJECT = 'cmsn47kcs0000w1l8l8fye4xo'

async function main() {
  const raw = JSON.parse(fs.readFileSync(snapshotPath, 'utf8'))
  const data = raw.data ?? raw
  const projectId = data.id

  const demo = await authService.getDemoUser()

  const existing = await prisma.project.findUnique({ where: { id: projectId } })
  if (existing) {
    console.log('[restore] project already exists', projectId)
    return projectId
  }

  await prisma.project.create({
    data: {
      id: projectId,
      user: { connect: { id: demo.id } },
      name: data.name,
      prompt: data.prompt ?? '',
      status: data.status ?? 'PLANNING',
      ratio: data.ratio ?? '9:16',
      duration: data.duration ?? 30,
      style: data.style,
      audience: data.audience,
      goal: data.goal,
      videoStyle: data.videoStyle,
      emotion: data.emotion,
      directorBrief: data.directorBrief ?? undefined,
      bgmCategory: data.bgmCategory ?? 'tech_pulse',
      bgmVolume: data.bgmVolume ?? 0.22,
    },
  })

  for (const scene of data.scenes) {
    await prisma.scene.create({
      data: {
        id: scene.id,
        projectId,
        order: scene.order,
        title: scene.title,
        description: scene.description,
        visualPrompt: scene.visualPrompt,
        voiceText: scene.voiceText,
        voiceId: scene.voiceId ?? 'lyrical',
        voiceEmotion: scene.voiceEmotion ?? 'professional',
        duration: scene.duration,
        storyBeat: scene.storyBeat,
        shotType: scene.shotType,
        cameraMotion: scene.cameraMotion,
        lighting: scene.lighting,
        emotion: scene.emotion,
        action: scene.action,
        negativePrompt: scene.negativePrompt,
        transition: scene.transition,
        sceneType: scene.sceneType,
        purpose: scene.purpose,
        componentType: scene.componentType,
        cues: scene.cues ?? undefined,
        imageSource: scene.imageSource,
      },
    })

    const donorImage = path.join(
      storageRoot,
      'images',
      `scene-${IMAGE_DONOR_PROJECT}-${scene.order}.png`,
    )
    const targetImage = path.join(storageRoot, 'images', `scene-${projectId}-${scene.order}.png`)

    if (fs.existsSync(donorImage)) {
      fs.mkdirSync(path.dirname(targetImage), { recursive: true })
      fs.copyFileSync(donorImage, targetImage)
    }

    const imageUrl = `/storage/images/scene-${projectId}-${scene.order}.png`
    if (fs.existsSync(targetImage)) {
      await prisma.scene.update({
        where: { id: scene.id },
        data: { imageUrl },
      })
      await assetRepository.create({
        projectId,
        sceneId: scene.id,
        type: AssetType.IMAGE,
        url: imageUrl,
        provider: 'acceptance-seed',
        metadata: { source: IMAGE_DONOR_PROJECT },
      })
    }
  }

  console.log('[restore] project seeded', projectId)
  console.log('[restore] generating voice via TTS...')
  await productionService.regenerateVoice(projectId)
  console.log('[restore] voice generation complete')
  return projectId
}

main()
  .then((id) => {
    console.log('[restore] OK', id)
  })
  .catch((err) => {
    console.error('[restore] FAILED', err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
