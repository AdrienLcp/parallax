import type { RoomCode } from '@parallax/protocol/identifiers'

import type { Rooms } from '@/domain/room/rooms'

/** One object per room, named by its code. */
export const roomsOf = (namespace: Env['ROOMS']): Rooms => {
  const roomOf = (code: RoomCode) => namespace.get(namespace.idFromName(code))

  return {
    connect: (code, request) => roomOf(code).fetch(request),
    open: (room) => roomOf(room.code).open(room)
  }
}
