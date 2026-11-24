import type { SeatId } from '@parallax/protocol/identifiers'
import type { Seat } from '@parallax/protocol/room'
import type {
  PlayerRoomMessage,
  ScreenRoomMessage
} from '@parallax/protocol/server-message'

import type { OpenedRoom, StoredSeat } from './room'

/** The seats as anyone may see them: no session, and whether a phone is there right now. */
export const seatsSeen = (
  seats: readonly StoredSeat[],
  connectedSeatIds: ReadonlySet<SeatId>
): Seat[] =>
  seats.map(({ isReady, name, seatId, slot }) => ({
    isConnected: connectedSeatIds.has(seatId),
    isReady,
    name,
    seatId,
    slot
  }))

export const screenRoomMessageOf = ({
  room,
  seats
}: {
  room: OpenedRoom
  seats: Seat[]
}): ScreenRoomMessage => ({ code: room.code, seats, type: 'room.updated' })

export const playerRoomMessageOf = ({
  room,
  seats,
  youId
}: {
  room: OpenedRoom
  seats: Seat[]
  youId: SeatId
}): PlayerRoomMessage => ({ ...screenRoomMessageOf({ room, seats }), youId })
