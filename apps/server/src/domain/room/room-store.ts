import { z } from 'zod'

import {
  type GameId,
  gameIdSchema,
  type RoomPhase,
  roomPhaseSchema
} from '@parallax/protocol/games'
import {
  roomCodeSchema,
  type SeatId,
  screenTokenSchema,
  seatIdSchema,
  sessionIdSchema
} from '@parallax/protocol/identifiers'
import { seatNameSchema } from '@parallax/protocol/lobby'
import { seatSlotSchema } from '@parallax/protocol/room'

import type { SqlDatabase } from '@/infrastructure/durable-objects/sql-database'

import type { OpenedRoom, StoredRoom, StoredSeat } from './room'
import type { AbsenceChange } from './seat-release'

const roomRowSchema = z
  .object({
    code: roomCodeSchema,
    game: gameIdSchema,
    phase: roomPhaseSchema,
    screen_token: screenTokenSchema
  })
  .transform(
    (row): StoredRoom => ({
      code: row.code,
      game: row.game,
      phase: row.phase,
      screenToken: row.screen_token
    })
  )

const erasureRowSchema = z.object({
  erase_at_ms: z.number().int().nullable()
})

const seatRowSchema = z
  .object({
    absent_since_ms: z.number().int().nullable(),
    is_ready: z.number().int(),
    name: seatNameSchema.nullable(),
    seat_id: seatIdSchema,
    session_id: sessionIdSchema,
    slot: seatSlotSchema
  })
  .transform(
    (row): StoredSeat => ({
      absentSinceMs: row.absent_since_ms,
      isReady: row.is_ready !== 0,
      name: row.name,
      seatId: row.seat_id,
      sessionId: row.session_id,
      slot: row.slot
    })
  )

/** One room's persistence, inside the Durable Object that holds it. */
export type RoomStore = {
  /** Takes its slot over from the released seat that may still hold it. */
  addSeat: (seat: StoredSeat) => void
  erase: () => void
  /** Ready under its picked name, or its colour for `null`. */
  markReady: (seatId: SeatId, name: string | null) => void
  markUnready: (seatId: SeatId) => void
  open: (room: OpenedRoom) => void
  /** `null` until the room is opened, or for a room opened before erasure was stored. */
  readErasureAt: () => number | null
  readRoom: () => StoredRoom | null
  /** In slot order. */
  readSeats: () => StoredSeat[]
  recordAbsences: (changes: readonly AbsenceChange[]) => void
  /** The seat is gone for good: its phone comes back, if ever, as a newcomer. */
  removeSeat: (seatId: SeatId) => void
  setErasureAt: (atMs: number) => void
  setGame: (game: GameId) => void
  setPhase: (phase: RoomPhase) => void
  /** A game started: every seat has to be ready again for the next one. */
  spendReadyMarks: () => void
}

export const createRoomStore = (database: SqlDatabase): RoomStore => ({
  addSeat: ({ absentSinceMs, isReady, name, seatId, sessionId, slot }) => {
    database.transaction(() => {
      database.run('DELETE FROM seats WHERE slot = ?', slot)
      database.run(
        'INSERT INTO seats (seat_id, session_id, slot, absent_since_ms, name, is_ready) VALUES (?, ?, ?, ?, ?, ?)',
        seatId,
        sessionId,
        slot,
        absentSinceMs,
        name,
        isReady ? 1 : 0
      )
    })
  },
  erase: () => {
    database.transaction(() => {
      database.run('DELETE FROM seats')
      database.run('DELETE FROM room')
    })
  },
  markReady: (seatId, name) => {
    database.run(
      'UPDATE seats SET is_ready = 1, name = ? WHERE seat_id = ?',
      name,
      seatId
    )
  },
  markUnready: (seatId) => {
    database.run('UPDATE seats SET is_ready = 0 WHERE seat_id = ?', seatId)
  },
  open: ({ code, game, screenToken }) => {
    database.run(
      "INSERT INTO room (id, code, screen_token, game, phase) VALUES (1, ?, ?, ?, 'lobby')",
      code,
      screenToken,
      game
    )
  },
  readErasureAt: () => {
    const row = database.run('SELECT erase_at_ms FROM room').at(0)

    return row === undefined ? null : erasureRowSchema.parse(row).erase_at_ms
  },
  readRoom: () => {
    const row = database
      .run('SELECT code, screen_token, game, phase FROM room')
      .at(0)

    return row === undefined ? null : roomRowSchema.parse(row)
  },
  readSeats: () =>
    database
      .run(
        'SELECT seat_id, session_id, slot, absent_since_ms, name, is_ready FROM seats ORDER BY slot'
      )
      .map((row) => seatRowSchema.parse(row)),
  recordAbsences: (changes) => {
    database.transaction(() => {
      for (const { absentSinceMs, seatId } of changes) {
        database.run(
          'UPDATE seats SET absent_since_ms = ? WHERE seat_id = ?',
          absentSinceMs,
          seatId
        )
      }
    })
  },
  removeSeat: (seatId) => {
    database.run('DELETE FROM seats WHERE seat_id = ?', seatId)
  },
  setErasureAt: (atMs) => {
    database.run('UPDATE room SET erase_at_ms = ?', atMs)
  },
  setGame: (game) => {
    database.run('UPDATE room SET game = ?', game)
  },
  setPhase: (phase) => {
    database.run('UPDATE room SET phase = ?', phase)
  },
  spendReadyMarks: () => {
    database.run('UPDATE seats SET is_ready = 0')
  }
})
