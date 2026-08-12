import { onUnmounted, ref } from 'vue'
import type { ProductionStatus } from '@/api/production'

function resolveWsBase() {
  if (import.meta.env.VITE_WS_URL) {
    return import.meta.env.VITE_WS_URL.replace(/\/$/, '')
  }
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  return `${protocol}//${window.location.host}/ws`
}

export interface ProductionEvent {
  type: string
  projectId: string
  taskId: string | null
  step: string | null
  status: string | null
  progress: number | null
  message: string | null
  timestamp: string
}

export function useProjectWebSocket(
  projectId: string,
  onUpdate: (status: ProductionStatus) => void,
  onEvent?: (event: ProductionEvent) => void,
  onReconnect?: () => void,
) {
  const connected = ref(false)
  const wsUrl = `${resolveWsBase()}/projects/${projectId}`

  let ws: WebSocket | null = null
  let reconnectTimer: number | undefined
  let reconnectAttempts = 0

  function connect() {
    ws = new WebSocket(wsUrl)

    ws.onopen = () => {
      connected.value = true
      if (reconnectAttempts > 0 && onReconnect) onReconnect()
      reconnectAttempts = 0
    }

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data as string) as { event: string; data: unknown }
        if (msg.event === 'production:update' && msg.data) {
          onUpdate(msg.data as ProductionStatus)
        } else if (msg.event === 'production:event' && msg.data) {
          onEvent?.(msg.data as ProductionEvent)
        }
      } catch {
        // ignore malformed messages
      }
    }

    ws.onclose = () => {
      connected.value = false
      reconnectAttempts += 1
      reconnectTimer = window.setTimeout(connect, Math.min(3000 * reconnectAttempts, 10000))
    }

    ws.onerror = () => {
      ws?.close()
    }
  }

  connect()

  onUnmounted(() => {
    if (reconnectTimer) window.clearTimeout(reconnectTimer)
    ws?.close()
  })

  return { connected }
}
