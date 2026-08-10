import bcrypt from 'bcryptjs'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const demoPasswordHash = await bcrypt.hash('demo123456', 10)

  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@xueai.local' },
    update: { password: demoPasswordHash },
    create: {
      email: 'demo@xueai.local',
      password: demoPasswordHash,
      name: 'Demo User',
      credits: 12560,
    },
  })

  const existing = await prisma.project.findFirst({
    where: { name: 'AI学习30天：从入门到自动化工作流' },
  })

  if (!existing) {
    const project = await prisma.project.create({
      data: {
        userId: demoUser.id,
        name: 'AI学习30天：从入门到自动化工作流',
        prompt: '制作一个 AI 工具宣传短视频，风格专业、节奏紧凑',
        status: 'PLANNING',
        ratio: '9:16',
        duration: 60,
        style: '科技干货',
        scenes: {
          create: [
            {
              order: 1,
              title: '黄金3秒视觉钩子',
              description: '当大多数人还在讨论AI会不会取代人类时，头部创作者已经用AI自动化工厂批量生产。',
              visualPrompt: 'Cinematic dark studio, futuristic digital workspace, 8k render',
              voiceText: '当大多数人还在讨论AI时，头部创作者已用AI工厂批量生产。',
              duration: 8,
            },
            {
              order: 2,
              title: '行业痛点拆解',
              description: '传统剪辑：写文案、找素材、配字幕，1分钟视频耗时4小时。',
              visualPrompt: 'Minimalist dark slate studio workspace, editing suite comparison',
              voiceText: '传统剪辑：写文案、找素材、配字幕，1分钟视频耗时4小时。',
              duration: 12,
            },
          ],
        },
      },
    })

    await prisma.videoTask.createMany({
      data: [
        { projectId: project.id, type: 'SCRIPT', status: 'SUCCESS', progress: 100 },
        { projectId: project.id, type: 'IMAGE', status: 'WAITING', progress: 0 },
        { projectId: project.id, type: 'VOICE', status: 'WAITING', progress: 0 },
        { projectId: project.id, type: 'RENDER', status: 'WAITING', progress: 0 },
      ],
    })
  }

  console.log('Seed completed. Demo login: demo@xueai.local / demo123456')
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
