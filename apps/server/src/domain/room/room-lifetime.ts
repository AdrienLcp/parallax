import type { StoredSeat } from './room'
import { nextReleaseAtMs } from './seat-release'

/** A room nobody joined or reopened for this long is erased: an office day and then some. */
export const ROOM_IDLE_LIFETIME_MS = 12 * 60 * 60 * 1000

export const roomErasureAtMs = (lastUseMs: number): number =>
  lastUseMs + ROOM_IDLE_LIFETIME_MS

/** The room's one alarm: the next seat to come free, or else its erasure. */
export const roomAlarmAtMs = ({
  erasureAtMs,
  nowMs,
  seats
}: {
  erasureAtMs: number
  nowMs: number
  seats: readonly StoredSeat[]
}): number =>
  Math.min(erasureAtMs, nextReleaseAtMs(seats, nowMs) ?? erasureAtMs)
