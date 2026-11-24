import type {
  RoomCode,
  ScreenToken,
  SeatId,
  SessionId
} from '@parallax/protocol/identifiers'
import type { SeatSlot } from '@parallax/protocol/room'

/** A room once its screen opened it. */
export type OpenedRoom = {
  code: RoomCode
  screenToken: ScreenToken
}

/** A seat as the room keeps it: the session behind it never leaves the server. */
export type StoredSeat = {
  /** Since when no phone holds it, `null` while one does. */
  absentSinceMs: number | null
  /** Ready for the next game, until the screen starts it. */
  isReady: boolean
  /** The name its player picked, `null` while it goes by its colour. */
  name: string | null
  seatId: SeatId
  sessionId: SessionId
  slot: SeatSlot
}
