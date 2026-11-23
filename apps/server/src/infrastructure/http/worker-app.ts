import type { Hono } from 'hono'

import type { Rooms } from '@/domain/room/rooms'

/** What the composition root hands every route. */
export type WorkerVariables = {
  rooms: Rooms
}

export type WorkerApp = Hono<{ Bindings: Env; Variables: WorkerVariables }>
