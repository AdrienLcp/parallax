import type { GameId, RoomPhase } from '@parallax/protocol/games'
import type {
  RoomCode,
  ScreenToken,
  SeatId,
  SessionId
} from '@parallax/protocol/identifiers'
import type { SeatSlot } from '@parallax/protocol/room'

/** A room once its screen opened it, on the game the screen picked. */
export type OpenedRoom = {
  code: RoomCode
  game: GameId
  screenToken: ScreenToken
}

/** A room as it stands: the game it plays next or now, and whether that game runs. */
export type StoredRoom = OpenedRoom & {
  phase: RoomPhase
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
