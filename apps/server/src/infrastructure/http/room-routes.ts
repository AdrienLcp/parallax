import { DEFAULT_GAME_ID } from '@parallax/protocol/games'
import {
  type CreateRoomResponse,
  createRoomRequestSchema
} from '@parallax/protocol/http'
import { roomCodeSchema } from '@parallax/protocol/identifiers'
import { API_ROUTES, ROOM_SOCKET_ROUTE } from '@parallax/protocol/routes'

import { openFreshRoom } from '@/domain/room/room-opening'
import { newRoomCode, newScreenToken } from '@/infrastructure/ids'

import {
  answerInternalError,
  answerInvalidInput,
  answerNotFound
} from './error-handling'
import { limitRoomCreation } from './rate-limit'
import type { WorkerApp } from './worker-app'

export const registerRoomRoutes = (app: WorkerApp) => {
  app.post(API_ROUTES.rooms, limitRoomCreation, async (context) => {
    // An empty body opens the default game, as every screen did before it picked one.
    const text = await context.req.text()
    let body: unknown = {}
    try {
      body = text === '' ? {} : JSON.parse(text)
    } catch {
      return answerInvalidInput(context)
    }
    const request = createRoomRequestSchema.safeParse(body)

    if (!request.success) {
      return answerInvalidInput(context)
    }

    const opened = await openFreshRoom({
      game: request.data.game ?? DEFAULT_GAME_ID,
      newRoomCode,
      newScreenToken,
      rooms: context.var.rooms
    })

    if (opened.status === 'failure') {
      console.error({ code: opened.error, message: 'No room opened' })

      return answerInternalError(context)
    }

    const created: CreateRoomResponse = {
      code: opened.data.code,
      screenToken: opened.data.screenToken
    }

    return context.json(created, 201)
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
