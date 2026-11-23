import { Result } from '@adrienlcp/result'

import type { Credentials } from '@parallax/protocol/client-message'
import type { SeatId, SessionId } from '@parallax/protocol/identifiers'
import { ROOM_SEAT_LIMIT, type SeatSlot } from '@parallax/protocol/room'

import type { Admission } from './admission'
import type { OpenedRoom, StoredSeat } from './room'
import type { RoomStore } from './room-store'

export type AdmissionRefusal =
  | 'room_full'
  | 'room_not_found'
  | 'screen_token_invalid'

export const openRoom = (
  store: RoomStore,
  room: OpenedRoom
): Result<void, 'already_open'> => {
  if (store.readRoom() !== null) {
    return Result.failure('already_open')
  }

  store.open(room)

  return Result.success()
}

const firstFreeSlot = (seats: readonly StoredSeat[]): SeatSlot | null => {
  const taken = new Set(seats.map((seat) => seat.slot))

  return (
    Array.from({ length: ROOM_SEAT_LIMIT }, (_, slot) => slot).find(
      (slot) => !taken.has(slot)
    ) ?? null
  )
}

/** A phone gets back the seat its session already holds, or the first free one. */
const seatPlayer = ({
  mintSeatId,
  sessionId,
  store
}: {
  mintSeatId: () => SeatId
  sessionId: SessionId
  store: RoomStore
}): Result<Admission, 'room_full'> => {
  const seats = store.readSeats()
  const kept = seats.find((seat) => seat.sessionId === sessionId)

  if (kept !== undefined) {
    return Result.success({ role: 'player', seatId: kept.seatId })
  }

  const slot = firstFreeSlot(seats)

  if (slot === null) {
    return Result.failure('room_full')
  }

  const seatId = mintSeatId()
  store.addSeat({ seatId, sessionId, slot })

  return Result.success({ role: 'player', seatId })
}

export const admit = ({
  credentials,
  mintSeatId,
  store
}: {
  credentials: Credentials
  mintSeatId: () => SeatId
  store: RoomStore
}): Result<Admission, AdmissionRefusal> => {
  const room = store.readRoom()

  if (room === null) {
    return Result.failure('room_not_found')
  }

  if (credentials.role === 'player') {
    return seatPlayer({ mintSeatId, sessionId: credentials.sessionId, store })
  }

  return credentials.screenToken === room.screenToken
    ? Result.success({ role: 'screen' })
    : Result.failure('screen_token_invalid')
}
