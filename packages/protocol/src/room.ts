import { z } from 'zod'

import { seatIdSchema } from './identifiers'

/** The most phones a room seats, whatever the game: one colour each on the arena. */
export const ROOM_SEAT_LIMIT = 6

/** A seat's place in the room, from 0: its colour on the screen and on the phone. */
export const seatSlotSchema = z
  .number()
  .int()
  .nonnegative()
  .max(ROOM_SEAT_LIMIT - 1)

export const seatSchema = z.object({
  isConnected: z.boolean(),
  seatId: seatIdSchema,
  slot: seatSlotSchema
})

export type SeatSlot = z.infer<typeof seatSlotSchema>
export type Seat = z.infer<typeof seatSchema>
