import { Hono } from 'hono'

import { roomsOf } from '@/infrastructure/durable-objects/rooms-namespace'
import {
  answerNotFound,
  answerUnexpected
} from '@/infrastructure/http/error-handling'
import { registerHealthRoutes } from '@/infrastructure/http/health-routes'
import { registerRoomRoutes } from '@/infrastructure/http/room-routes'
import type { WorkerApp } from '@/infrastructure/http/worker-app'

/** The Worker's front door: the API and the room sockets; the web app is served as static assets. */
export const createApp = (): WorkerApp => {
  const app: WorkerApp = new Hono()

  app.use(async (context, next) => {
    context.set('rooms', roomsOf(context.env.ROOMS))
    await next()
  })

  registerHealthRoutes(app)
  registerRoomRoutes(app)

  app.notFound(answerNotFound)
  app.onError(answerUnexpected)

  return app
}
