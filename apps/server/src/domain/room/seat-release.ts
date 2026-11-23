import type { SeatId } from '@parallax/protocol/identifiers'

import type { StoredSeat } from './room'

/**
 * A seat whose phone has been gone this long is free for anyone: long enough
 * to pocket the phone between two rounds, short enough that a newcomer barely waits.
 */
export const SEAT_RELEASE_AFTER_MS = 60_000

type ReleasedSeat = StoredSeat & { absentSinceMs: number }

/** Free for a newcomer, yet still its session's own until someone takes the slot. */
export const isReleased = (
  seat: StoredSeat,
  nowMs: number
): seat is ReleasedSeat =>
  seat.absentSinceMs !== null &&
  nowMs - seat.absentSinceMs >= SEAT_RELEASE_AFTER_MS

/** The seats the room shows: present, or absent for a short while. */
export const heldSeats = (
  seats: readonly StoredSeat[],
  nowMs: number
): StoredSeat[] => seats.filter((seat) => !isReleased(seat, nowMs))

/** Oldest absence first: the seat its session is least likely to come back to. */
export const releasedSeats = (
  seats: readonly StoredSeat[],
  nowMs: number
): ReleasedSeat[] =>
  seats
    .filter((seat) => isReleased(seat, nowMs))
    .toSorted((first, second) => first.absentSinceMs - second.absentSinceMs)

export type AbsenceChange = {
  absentSinceMs: number | null
  seatId: SeatId
}

/** A seat whose phone just left starts its absence; a seat whose phone is back ends it. */
export const absenceChanges = ({
  connectedSeatIds,
  nowMs,
  seats
}: {
  connectedSeatIds: ReadonlySet<SeatId>
  nowMs: number
  seats: readonly StoredSeat[]
}): AbsenceChange[] =>
  seats.flatMap(({ absentSinceMs, seatId }): AbsenceChange[] => {
    const isConnected = connectedSeatIds.has(seatId)

    if (isConnected && absentSinceMs !== null) {
      return [{ absentSinceMs: null, seatId }]
    }

    if (!isConnected && absentSinceMs === null) {
      return [{ absentSinceMs: nowMs, seatId }]
    }

    return []
  })

/** When the next absent seat comes free, or `null` when none is on its way out. */
export const nextReleaseAtMs = (
  seats: readonly StoredSeat[],
  nowMs: number
): number | null => {
  const upcoming = seats.flatMap(({ absentSinceMs }) =>
    absentSinceMs === null || nowMs - absentSinceMs >= SEAT_RELEASE_AFTER_MS
      ? []
      : [absentSinceMs + SEAT_RELEASE_AFTER_MS]
  )

  return upcoming.length === 0 ? null : Math.min(...upcoming)
}
