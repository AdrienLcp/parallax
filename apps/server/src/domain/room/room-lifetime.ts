/** A room nobody joined or reopened for this long is erased: an office day and then some. */
export const ROOM_IDLE_LIFETIME_MS = 12 * 60 * 60 * 1000

export const roomErasureAtMs = (lastUseMs: number): number =>
  lastUseMs + ROOM_IDLE_LIFETIME_MS
