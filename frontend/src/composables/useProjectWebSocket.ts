import { onUnmounted, ref } from 'vue'
import type { ProductionStatus } from '@/api/production'

function resolveWsBase() {
  if (import.meta.env.VITE_WS_URL) {
    return import.meta.env.VITE_WS_URL.replace(/\/$/, '')
  }
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  return `${protocol}//${window.location.host}/ws`
}

export function useProjectWebSocket(projectId: string, onUpdate: (status: ProductionStatus) => void) {
  const connected = ref(false)
  const wsUrl = `${resolveWsBase()}/projects/${projectId}`

  let ws: WebSocket | null = null
  let reconnectTimer: number | undefined

  function connect() {
    ws = new WebSocket(wsUrl)

    ws.onopen = () => {
      connected.value = true
    }

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data as string) as { event: string; data: ProductionStatus }
        if (msg.event === 'production:update' && msg.data) {
          onUpdate(msg.data)
        }
      } catch {
        // ignore malformed messages
      }
    }

    ws.onclose = () => {
      connected.value = false
      reconnectTimer = window.setTimeout(connect, 3000)
    }
  }

  connect()

  onUnmounted(() => {
    if (reconnectTimer) window.clearTimeout(reconnectTimer)
    ws?.close()
  })

  return { connected }
}
