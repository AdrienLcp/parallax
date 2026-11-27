import { z } from 'zod'

import { seatIdSchema } from './identifiers'

/**
 * How often a phone may send its sticks, at most: each frame a Durable Object
 * receives is billed, so the sticks go out at this pace and only when they
 * moved, like the sumo's, the tower's and the claw's.
 */
export const GLOBE_STICK_HZ = 20

const axisSchema = z.number().min(-1).max(1)

/**
 * The holder's stick, each axis from -1 to 1: `x` east (positive) and west,
 * `y` north (positive) and south. It pushes the crosshair over the ground,
 * which keeps coasting once the stick is let go; the screen clamps the length
 * to 1.
 */
export const globeStickSchema = z.object({
  type: z.literal('globe.stick'),
  x: axisSchema,
  y: axisSchema
})

/**
 * The second stick: how fast the loupe magnifies, from -1 (back out) to 1 (in).
 * Sent at the stick's pace, only when it changed; the loupe keeps going at
 * that rate until the next, within its range.
 */
export const globeZoomSchema = z.object({
  rate: axisSchema,
  type: z.literal('globe.zoom')
})

/** Plants the pin under the crosshair: the turn's answer. */
export const globePlantSchema = z.object({ type: z.literal('globe.plant') })

export const globeSeatStickSchema = globeStickSchema.extend({
  seatId: seatIdSchema
})

export const globeSeatZoomSchema = globeZoomSchema.extend({
  seatId: seatIdSchema
})

export const globeSeatPlantSchema = globePlantSchema.extend({
  seatId: seatIdSchema
})

/** What a turn asks to find. */
export const globePlaceKindSchema = z.enum([
  'country',
  'city',
  'monument',
  'mountain'
])

/**
 * The place a turn asks for: its id in the app's place bank, which the phones
 * share with the screen, so each phone names it in its own language.
 */
export const globePlaceSchema = z.object({
  id: z.string().min(1).max(64),
  kind: globePlaceKindSchema
})

/**
 * What the screen, which runs the game, tells the phones: a few times a
 * second at most, never where the globe points, only what a phone draws.
 */
export const globeStateSchema = z.object({
  /**
   * `aiming`: the holder turns the globe against the clock; `reveal`: the
   * pin and the answer are shown; `decided`: every turn is played.
   */
  phase: z.enum(['lobby', 'aiming', 'reveal', 'decided']),
  /** The place the current turn asks for; `null` in the lobby and once decided. */
  place: globePlaceSchema.nullable(),
  /** The last planted pin, while it is revealed; `null` otherwise. */
  result: z
    .object({
      /** 0 when the pin stands inside the place (a country) or on it. */
      km: z.number().nonnegative(),
      points: z.number().int().nonnegative(),
      seatId: seatIdSchema
    })
    .nullable(),
  seats: z.array(
    z.object({
      score: z.number().int().nonnegative(),
      seatId: seatIdSchema,
      /** The best score once decided. */
      won: z.boolean()
    })
  ),
  /** Seconds left to plant while aiming; `null` otherwise. */
  secondsLeft: z.number().nonnegative().nullable(),
  /** Who holds the globe this turn; `null` in the lobby and once decided. */
  turnSeatId: seatIdSchema.nullable(),
  /** Turns played so far, out of the match's (each seat holds the globe as often). */
  turns: z.object({ of: z.number().int(), played: z.number().int() }),
  type: z.literal('globe.state')
})

export type GlobePlace = z.infer<typeof globePlaceSchema>
export type GlobePlaceKind = z.infer<typeof globePlaceKindSchema>
export type GlobeSeatPlant = z.infer<typeof globeSeatPlantSchema>
export type GlobeSeatStick = z.infer<typeof globeSeatStickSchema>
export type GlobeSeatZoom = z.infer<typeof globeSeatZoomSchema>
export type GlobeState = z.infer<typeof globeStateSchema>
