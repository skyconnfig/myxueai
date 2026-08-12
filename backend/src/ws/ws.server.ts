import type { Server as HttpServer } from 'node:http'
import { WebSocketServer, WebSocket } from 'ws'
import { logger } from '../utils/logger.js'
import { WsEvents } from './events.js'

type ProjectRoom = Set<WebSocket>

class WsHub {
  private wss: WebSocketServer | null = null
  private rooms = new Map<string, ProjectRoom>()

  close() {
    for (const room of this.rooms.values()) {
      for (const client of room) {
        client.close(1001, 'Server shutting down')
      }
    }
    this.rooms.clear()
    if (this.wss) {
      this.wss.close()
      this.wss = null
    }
  }

  attach(server: HttpServer) {
    this.close()
    this.wss = new WebSocketServer({ server })
    this.wss.on('error', (error) => {
      logger(`WebSocket server error: ${error.message}`)
    })

    this.wss.on('connection', (socket, req) => {
      const url = req.url ?? ''
      if (!url.startsWith('/ws/projects/')) {
        socket.close(1008, 'Invalid path — use /ws/projects/:id')
        return
      }
      const projectId = url.split('/ws/projects/')[1]?.split('?')[0]
      let room = this.rooms.get(projectId)
      if (!room) {
        room = new Set()
        this.rooms.set(projectId, room)
      }
      room.add(socket)
      logger(`WebSocket connected: project ${projectId}`)

      socket.on('close', () => {
        room?.delete(socket)
        if (room?.size === 0) this.rooms.delete(projectId)
      })

      socket.send(JSON.stringify({ event: 'connected', data: { projectId } }))
    })

    logger('WebSocket server ready at /ws/projects/:id')
  }

  broadcast(projectId: string, event: string, data: unknown) {
    const room = this.rooms.get(projectId)
    if (!room?.size) return

    const payload = JSON.stringify({ event, data })
    for (const client of room) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(payload)
      }
    }
  }

  broadcastProductionUpdate(projectId: string, data: unknown) {
    this.broadcast(projectId, WsEvents.PRODUCTION_UPDATE, data)
  }

  broadcastProductionEvent(projectId: string, type: string, payload: Record<string, unknown>) {
    this.broadcast(projectId, WsEvents.PRODUCTION_EVENT, {
      type,
      projectId,
      timestamp: new Date().toISOString(),
      ...payload,
    })
  }
}

export const wsHub = new WsHub()
