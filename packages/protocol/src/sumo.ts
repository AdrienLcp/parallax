import { z } from 'zod'

import { seatIdSchema } from './identifiers'

/**
 * How often a phone may send its stick, at most. Each frame a Durable Object
 * receives is billed, so the stick goes out at this pace and only when it moved.
 */
export const SUMO_STICK_HZ = 20

const stickAxisSchema = z.number().min(-1).max(1)

/** A phone's stick, each axis from -1 to 1; the screen clamps its length to 1. */
export const sumoStickSchema = z.object({
  type: z.literal('sumo.stick'),
  x: stickAxisSchema,
  y: stickAxisSchema
})

export const sumoDashSchema = z.object({ type: z.literal('sumo.dash') })

/** The stick as the screen hears it, stamped with the seat that sent it. */
export const sumoSeatStickSchema = sumoStickSchema.extend({
  seatId: seatIdSchema
})

export const sumoSeatDashSchema = sumoDashSchema.extend({
  seatId: seatIdSchema
})

export const sumoTopStatusSchema = z.enum(['spinning', 'out'])

/**
 * What the screen, which runs the simulation, tells the phones: a few times a
 * second at most, never the positions, only what a phone draws.
 */
export const sumoStateSchema = z.object({
  phase: z.enum(['lobby', 'countdown', 'fighting', 'decided']),
  tops: z.array(
    z.object({
      roundsWon: z.number().int().nonnegative(),
      seatId: seatIdSchema,
      status: sumoTopStatusSchema
    })
  ),
  type: z.literal('sumo.state')
})

export type SumoStick = z.infer<typeof sumoStickSchema>
export type SumoSeatStick = z.infer<typeof sumoSeatStickSchema>
export type SumoSeatDash = z.infer<typeof sumoSeatDashSchema>
export type SumoState = z.infer<typeof sumoStateSchema>
