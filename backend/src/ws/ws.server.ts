import type { Server as HttpServer } from 'node:http'
import { WebSocketServer, WebSocket } from 'ws'
import { logger } from '../utils/logger.js'
import { WsEvents } from './events.js'

type ProjectRoom = Set<WebSocket>

class WsHub {
  private wss: WebSocketServer | null = null
  private rooms = new Map<string, ProjectRoom>()

  attach(server: HttpServer) {
    this.wss = new WebSocketServer({ server })

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
}

export const wsHub = new WsHub()
