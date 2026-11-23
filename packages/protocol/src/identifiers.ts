import { z } from 'zod'

/** A seat in a room: one phone, kept across its reconnections. */
export const seatIdSchema = z.string().min(1).max(64)

export type SeatId = z.infer<typeof seatIdSchema>
