import { z } from 'zod'

import { seatIdSchema } from './identifiers'

/**
 * How often a phone may send its stick, at most: each frame a Durable Object
 * receives is billed, so the stick goes out at this pace and only when it
 * moved, like the sumo's and the tower's.
 */
export const CLAW_STICK_HZ = 20

const axisSchema = z.number().min(-1).max(1)

/**
 * A phone's stick for its claw, each axis from -1 to 1: `x` across the
 * alcove, `z` in depth (towards the players is positive). The player aims by
 * watching the claw on the display; the screen clamps the length to 1.
 */
export const clawStickSchema = z.object({
  type: z.literal('claw.stick'),
  x: axisSchema,
  z: axisSchema
})

/**
 * The claw's one button. Empty, it lowers the claw where it hangs: it grips
 * and comes back up by itself. Holding a prize, it lets go: into a chute if
 * the claw hangs over one, back onto the pile otherwise.
 */
export const clawDropSchema = z.object({ type: z.literal('claw.drop') })

export const clawSeatStickSchema = clawStickSchema.extend({
  seatId: seatIdSchema
})

export const clawSeatDropSchema = clawDropSchema.extend({
  seatId: seatIdSchema
})

/**
 * What a claw is doing: `aiming` while its player steers it empty, `busy`
 * from the drop until it comes back up, `holding` while its player steers it
 * with a prize towards a chute.
 */
export const clawActivitySchema = z.enum(['aiming', 'busy', 'holding'])

/**
 * What the screen, which runs the game, tells the phones: a few times a
 * second at most. Each claw's place is there for the phone's small map, as a
 * share of the alcove: `x` from -1 (left wall) to 1, `z` from -1 (back wall)
 * to 1 (front).
 */
export const clawStateSchema = z.object({
  /** `decided`: time is up and the winner is shown, before the room goes back to its lobby. */
  phase: z.enum(['lobby', 'playing', 'decided']),
  seats: z.array(
    z.object({
      activity: clawActivitySchema,
      /** Points so far: a plush is worth 1, a capsule more. */
      score: z.number().int().nonnegative(),
      seatId: seatIdSchema,
      x: axisSchema,
      z: axisSchema
    })
  ),
  /** Whole seconds left in the round; 0 once time is up. */
  secondsLeft: z.number().int().nonnegative(),
  type: z.literal('claw.state'),
  /** The seats with the best score once decided; empty while playing, or if nobody scored. */
  winners: z.array(seatIdSchema)
})

export type ClawActivity = z.infer<typeof clawActivitySchema>
export type ClawSeatDrop = z.infer<typeof clawSeatDropSchema>
export type ClawSeatStick = z.infer<typeof clawSeatStickSchema>
export type ClawState = z.infer<typeof clawStateSchema>
