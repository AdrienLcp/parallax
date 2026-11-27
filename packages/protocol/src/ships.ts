import { z } from 'zod'

import { seatIdSchema } from './identifiers'

/**
 * How often a phone may send its pad, at most: each frame a Durable Object
 * receives is billed, so the pad goes out at this pace and only when it
 * changed, like the other games' sticks.
 */
export const SHIPS_PAD_HZ = 20

const axisSchema = z.number().min(-1).max(1)

const stickSchema = z.object({ x: axisSchema, y: axisSchema })

/**
 * The whole pad of a ship at once, each stick's `y` growing downwards as the
 * thumb pulls: the screen reads it by the way it flies, so one frame serves
 * every way to pilot. `depth` is the hold of the forward (1) and back (-1)
 * buttons; `fire` the hold of the fire button.
 */
export const shipsPadSchema = z.object({
  depth: axisSchema,
  fire: z.boolean(),
  left: stickSchema,
  right: stickSchema,
  type: z.literal('ships.pad')
})

export const shipsSeatPadSchema = shipsPadSchema.extend({
  seatId: seatIdSchema
})

export type ShipsPad = z.infer<typeof shipsPadSchema>
export type ShipsSeatPad = z.infer<typeof shipsSeatPadSchema>
