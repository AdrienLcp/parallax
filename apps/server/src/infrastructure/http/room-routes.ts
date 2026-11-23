import type { CreateRoomResponse } from '@parallax/protocol/http'
import { roomCodeSchema } from '@parallax/protocol/identifiers'
import { API_ROUTES, ROOM_SOCKET_ROUTE } from '@parallax/protocol/routes'

import { openFreshRoom } from '@/domain/room/room-opening'
import { newRoomCode, newScreenToken } from '@/infrastructure/ids'

import { answerInternalError, answerNotFound } from './error-handling'
import { limitRoomCreation } from './rate-limit'
import type { WorkerApp } from './worker-app'

export const registerRoomRoutes = (app: WorkerApp) => {
  app.post(API_ROUTES.rooms, limitRoomCreation, async (context) => {
    const opened = await openFreshRoom({
      newRoomCode,
      newScreenToken,
      rooms: context.var.rooms
    })

    if (opened.status === 'failure') {
      console.error({ code: opened.error, message: 'No room opened' })

      return answerInternalError(context)
    }

    const body: CreateRoomResponse = opened.data

    return context.json(body, 201)
  })

  app.get(ROOM_SOCKET_ROUTE, async (context) => {
    const code = roomCodeSchema.safeParse(context.req.param('code'))

    if (!code.success) {
      return answerNotFound(context)
    }

    if (context.req.header('Upgrade') !== 'websocket') {
      return context.text('Expected a WebSocket', 426)
    }

    return await context.var.rooms.connect(code.data, context.req.raw)
  })
}
