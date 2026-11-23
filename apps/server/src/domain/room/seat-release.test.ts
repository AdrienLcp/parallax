import { describe, expect, it } from 'vitest'

import type { StoredSeat } from './room'
import { roomAlarmAtMs } from './room-lifetime'
import {
  absenceChanges,
  heldSeats,
  nextReleaseAtMs,
  SEAT_RELEASE_AFTER_MS
} from './seat-release'

const seatAt = (
  slot: number,
  absentSinceMs: number | null = null
): StoredSeat => ({
  absentSinceMs,
  seatId: `seat-${slot}`,
  sessionId: `session-of-phone-${slot}`,
  slot
})

describe('absenceChanges', () => {
  it('starts the absence of a seat that lost its phone and ends the one of a seat that found it', () => {
    const changes = absenceChanges({
      connectedSeatIds: new Set(['seat-1', 'seat-2']),
      nowMs: 5_000,
      seats: [seatAt(0), seatAt(1, 2_000), seatAt(2), seatAt(3, 1_000)]
    })

    expect(changes).toEqual([
      { absentSinceMs: 5_000, seatId: 'seat-0' },
      { absentSinceMs: null, seatId: 'seat-1' }
    ])
  })
})

describe('heldSeats', () => {
  it('shows an absent seat until the release delay is over', () => {
    const seats = [seatAt(0), seatAt(1, 0)]

    expect(heldSeats(seats, SEAT_RELEASE_AFTER_MS - 1)).toEqual(seats)
    expect(heldSeats(seats, SEAT_RELEASE_AFTER_MS)).toEqual([seatAt(0)])
  })
})

describe('nextReleaseAtMs', () => {
  it('is the earliest release still to come', () => {
    const seats = [seatAt(0, 0), seatAt(1, 30_000), seatAt(2, 10_000)]

    expect(nextReleaseAtMs(seats, SEAT_RELEASE_AFTER_MS)).toBe(
      10_000 + SEAT_RELEASE_AFTER_MS
    )
  })

  it('is null when every seat holds its phone', () => {
    expect(nextReleaseAtMs([seatAt(0), seatAt(1)], 0)).toBeNull()
  })
})

describe('roomAlarmAtMs', () => {
  it('rings for a release due before the erasure, and for the erasure otherwise', () => {
    const seats = [seatAt(0, 1_000)]

    expect(roomAlarmAtMs({ erasureAtMs: 1e9, nowMs: 2_000, seats })).toBe(
      1_000 + SEAT_RELEASE_AFTER_MS
    )
    expect(roomAlarmAtMs({ erasureAtMs: 5_000, nowMs: 2_000, seats })).toBe(
      5_000
    )
    expect(roomAlarmAtMs({ erasureAtMs: 1e9, nowMs: 2_000, seats: [] })).toBe(
      1e9
    )
  })
})
