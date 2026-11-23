import { z } from 'zod'

import {
  roomCodeSchema,
  screenTokenSchema,
  seatIdSchema,
  sessionIdSchema
} from '@parallax/protocol/identifiers'
import { seatSlotSchema } from '@parallax/protocol/room'

import type { SqlDatabase } from '@/infrastructure/durable-objects/sql-database'

import type { OpenedRoom, StoredSeat } from './room'

const roomRowSchema = z
  .object({ code: roomCodeSchema, screen_token: screenTokenSchema })
  .transform(
    (row): OpenedRoom => ({ code: row.code, screenToken: row.screen_token })
  )

const seatRowSchema = z
  .object({
    seat_id: seatIdSchema,
    session_id: sessionIdSchema,
    slot: seatSlotSchema
  })
  .transform(
    (row): StoredSeat => ({
      seatId: row.seat_id,
      sessionId: row.session_id,
      slot: row.slot
    })
  )

/** One room's persistence, inside the Durable Object that holds it. */
export type RoomStore = {
  addSeat: (seat: StoredSeat) => void
  erase: () => void
  open: (room: OpenedRoom) => void
  readRoom: () => OpenedRoom | null
  /** In slot order. */
  readSeats: () => StoredSeat[]
}

export const createRoomStore = (database: SqlDatabase): RoomStore => ({
  addSeat: ({ seatId, sessionId, slot }) => {
    database.run(
      'INSERT INTO seats (seat_id, session_id, slot) VALUES (?, ?, ?)',
      seatId,
      sessionId,
      slot
    )
  },
  erase: () => {
    database.transaction(() => {
      database.run('DELETE FROM seats')
      database.run('DELETE FROM room')
    })
  },
  open: ({ code, screenToken }) => {
    database.run(
      'INSERT INTO room (id, code, screen_token) VALUES (1, ?, ?)',
      code,
      screenToken
    )
  },
  readRoom: () => {
    const row = database.run('SELECT code, screen_token FROM room').at(0)

    return row === undefined ? null : roomRowSchema.parse(row)
  },
  readSeats: () =>
    database
      .run('SELECT seat_id, session_id, slot FROM seats ORDER BY slot')
      .map((row) => seatRowSchema.parse(row))
})
