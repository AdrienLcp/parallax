import { z } from 'zod'

/** Letters and digits nobody misreads across a room: no I, O, S, Z, 0, 1, 2, 5. */
export const ROOM_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRTUVWXY346789'

export const ROOM_CODE_LENGTH = 4

/** What the screen shows under its QR code and a phone may type: case and spaces forgiven. */
export const roomCodeSchema = z
  .string()
  .trim()
  .toUpperCase()
  .length(ROOM_CODE_LENGTH)
  .regex(new RegExp(`^[${ROOM_CODE_ALPHABET}]+$`))

export type RoomCode = z.infer<typeof roomCodeSchema>

/**
 * Proves a socket is the room's screen. Handed once, to whoever opened the
 * room, and never broadcast: a phone holding the code alone cannot take over
 * the display.
 */
export const screenTokenSchema = z.string().regex(/^[\w-]{24,64}$/)

export type ScreenToken = z.infer<typeof screenTokenSchema>

/**
 * A phone's own id, minted on the phone and kept in its storage, so a reload
 * or a dropped connection gets the same seat back. Never shown to anyone else.
 */
export const sessionIdSchema = z.string().regex(/^[\w-]{16,64}$/)

export type SessionId = z.infer<typeof sessionIdSchema>

/** A seat in a room: one phone, kept across its reconnections. Public, unlike the session behind it. */
export const seatIdSchema = z.string().min(1).max(64)

export type SeatId = z.infer<typeof seatIdSchema>
