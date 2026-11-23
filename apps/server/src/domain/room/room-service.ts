import { Result } from '@adrienlcp/result'

import type { Credentials } from '@parallax/protocol/client-message'
import type { SeatId, SessionId } from '@parallax/protocol/identifiers'
import { ROOM_SEAT_LIMIT, type SeatSlot } from '@parallax/protocol/room'

import type { Admission } from './admission'
import type { OpenedRoom, StoredSeat } from './room'
import type { RoomStore } from './room-store'
import { releasedSeats } from './seat-release'

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

/** An empty slot first, so a released seat keeps its chance to see its phone back. */
const slotForNewcomer = (
  seats: readonly StoredSeat[],
  nowMs: number
): SeatSlot | null => {
  const taken = new Set(seats.map((seat) => seat.slot))
  const empty = Array.from({ length: ROOM_SEAT_LIMIT }, (_, slot) => slot).find(
    (slot) => !taken.has(slot)
  )

  return empty ?? releasedSeats(seats, nowMs).at(0)?.slot ?? null
}

/** A phone gets back the seat its session still holds, or a free one. */
const seatPlayer = ({
  mintSeatId,
  nowMs,
  sessionId,
  store
}: {
  mintSeatId: () => SeatId
  nowMs: number
  sessionId: SessionId
  store: RoomStore
}): Result<Admission, 'room_full'> => {
  const seats = store.readSeats()
  const kept = seats.find((seat) => seat.sessionId === sessionId)

  if (kept !== undefined) {
    return Result.success({ role: 'player', seatId: kept.seatId })
  }

  const slot = slotForNewcomer(seats, nowMs)

  if (slot === null) {
    return Result.failure('room_full')
  }

  const seatId = mintSeatId()
  store.addSeat({ absentSinceMs: null, seatId, sessionId, slot })

  return Result.success({ role: 'player', seatId })
}

export const admit = ({
  credentials,
  mintSeatId,
  nowMs,
  store
}: {
  credentials: Credentials
  mintSeatId: () => SeatId
  nowMs: number
  store: RoomStore
}): Result<Admission, AdmissionRefusal> => {
  const room = store.readRoom()

  if (room === null) {
    return Result.failure('room_not_found')
  }

  if (credentials.role === 'player') {
    return seatPlayer({
      mintSeatId,
      nowMs,
      sessionId: credentials.sessionId,
      store
    })
  }

  return credentials.screenToken === room.screenToken
    ? Result.success({ role: 'screen' })
    : Result.failure('screen_token_invalid')
}
