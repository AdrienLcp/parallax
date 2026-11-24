import { z } from 'zod'

/** Long enough for a first name or a nickname, short enough to fit a seat on the roster. */
export const SEAT_NAME_MAX_LENGTH = 12

/** Control, format and line-separator characters: invisible, or able to reorder the text around them. */
const HIDDEN_CHARACTER = /[\p{Cc}\p{Cf}\p{Zl}\p{Zp}]/u

const HIDDEN_CHARACTERS = new RegExp(HIDDEN_CHARACTER.source, 'gu')

const tidySpaces = (name: string): string => name.replace(/\s+/gu, ' ').trim()

/**
 * A name a player picked for their seat, as the room shows it: trimmed, inner
 * runs of spaces collapsed, nothing invisible. Without one, a seat goes by its
 * colour.
 */
export const seatNameSchema = z
  .string()
  .max(SEAT_NAME_MAX_LENGTH)
  .refine((name) => !HIDDEN_CHARACTER.test(name))
  .refine((name) => name.length > 0 && name === tidySpaces(name))

/** What a phone's typed name becomes before it is sent: `null` when nothing shown is left. */
export const cleanSeatName = (typed: string): string | null => {
  const cleaned = tidySpaces(typed.replace(HIDDEN_CHARACTERS, ''))
    .slice(0, SEAT_NAME_MAX_LENGTH)
    .trimEnd()

  return cleaned.length > 0 ? cleaned : null
}

/** A phone's player is ready for the next game, under this name or, if `null`, the seat's colour. */
export const seatReadySchema = z.object({
  name: seatNameSchema.nullable(),
  type: z.literal('seat.ready')
})

/** A phone takes its ready mark back before the game starts. */
export const seatUnreadySchema = z.object({ type: z.literal('seat.unready') })

/** The screen started a game with the ready seats: every ready mark is spent. */
export const gameStartedSchema = z.object({ type: z.literal('game.started') })

export type SeatReady = z.infer<typeof seatReadySchema>
