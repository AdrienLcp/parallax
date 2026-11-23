import type { Result } from '@adrienlcp/result'

import type { RoomCode } from '@parallax/protocol/identifiers'

import type { OpenedRoom } from './room'

/** Every room, as the Worker's front door reaches them: one Durable Object each. */
export type Rooms = {
  /** Hands a WebSocket upgrade to the room's object. */
  connect: (code: RoomCode, request: Request) => Promise<Response>
  open: (room: OpenedRoom) => Promise<Result<void, 'already_open'>>
}
