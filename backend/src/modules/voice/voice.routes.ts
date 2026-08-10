import { Router } from 'express'
import { VOICE_EMOTIONS, VOICE_PRESETS } from '@xueai/shared'
import { sendSuccess } from '../../utils/response.js'

const router = Router()

router.get('/presets', (_req, res) => {
  return sendSuccess(res, {
    voices: VOICE_PRESETS.map((item) => ({
      id: item.id,
      label: item.label,
      subtitle: item.subtitle,
      gender: item.gender,
    })),
    emotions: VOICE_EMOTIONS.map((item) => ({
      id: item.id,
      label: item.label,
    })),
  })
})

export default router
