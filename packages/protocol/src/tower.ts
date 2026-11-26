import { z } from 'zod'

import { seatIdSchema } from './identifiers'

/**
 * How often a phone may send its aim, at most: like the sumo's stick, each
 * frame a Durable Object receives is billed, so the aim goes out at this pace
 * and only when it moved.
 */
export const TOWER_AIM_HZ = 20

const aimAxisSchema = z.number().min(-1).max(1)

/**
 * A phone's aim for the floating block, each axis from -1 to 1: `x` across the
 * alcove, `z` in depth (towards the players is positive). The screen clamps its
 * length to 1.
 */
export const towerAimSchema = z.object({
  type: z.literal('tower.aim'),
  x: aimAxisSchema,
  z: aimAxisSchema
})

/** Lets the floating block go where it hovers. */
export const towerDropSchema = z.object({ type: z.literal('tower.drop') })

/** Which of the two blocks on offer floats: the player may swap until they drop it. */
export const towerPickSchema = z.object({
  choice: z.union([z.literal(0), z.literal(1)]),
  type: z.literal('tower.pick')
})

/**
 * The second stick: how fast the floating block turns on itself, from -1 to 1,
 * positive clockwise seen from above. Sent at the aim's pace, only when it
 * changed; the block keeps turning at that rate until the next.
 */
export const towerSpinSchema = z.object({
  rate: aimAxisSchema,
  type: z.literal('tower.spin')
})

/**
 * The two ways to play, picked in the lobby: one tower built in turns for
 * points, where whoever brings blocks down loses as many, or one tower each
 * racing for height.
 */
export const towerRuleSchema = z.enum(['shared', 'race'])

/** What a fresh tower game plays until a phone picks the other rule. */
export const DEFAULT_TOWER_RULE = 'shared' satisfies TowerRule

/**
 * A phone asks for a rule. The screen keeps it, since it runs the game, and
 * takes it only in its lobby; the phones read the rule back in `tower.state`.
 */
export const towerRuleChoiceSchema = z.object({
  rule: towerRuleSchema,
  type: z.literal('tower.rule')
})

/** The aim as the screen hears it, stamped with the seat that sent it. */
export const towerSeatAimSchema = towerAimSchema.extend({
  seatId: seatIdSchema
})

export const towerSeatDropSchema = towerDropSchema.extend({
  seatId: seatIdSchema
})

export const towerSeatPickSchema = towerPickSchema.extend({
  seatId: seatIdSchema
})

export const towerSeatSpinSchema = towerSpinSchema.extend({
  seatId: seatIdSchema
})

export const towerSeatRuleChoiceSchema = towerRuleChoiceSchema.extend({
  seatId: seatIdSchema
})

/** The blocks drawn at random, two at a time for the player to pick from; every one has a flat top. */
export const towerBlockSchema = z.enum([
  'plank',
  'cube',
  'cylinder',
  'arch',
  'trapezoid',
  'ell'
])

/**
 * What the screen, which runs the physics, tells the phones: a few times a
 * second at most, never the positions, only what a phone draws.
 */
export const towerStateSchema = z.object({
  /**
   * `aiming`: a block floats, waiting to be dropped; `settling`: the dropped
   * block is still moving; `decided`: the shared game's turns are all played,
   * or the race is over.
   */
  phase: z.enum(['lobby', 'aiming', 'settling', 'decided']),
  rule: towerRuleSchema,
  seats: z.array(
    z.object({
      /** Height of the seat's tower in centimetres on the chart; the shared tower's height under `shared`. */
      heightCm: z.number().nonnegative(),
      /** The two blocks this seat may drop and the one floating; `null` while it holds no block. */
      offer: z
        .object({
          blocks: z.tuple([towerBlockSchema, towerBlockSchema]),
          choice: z.union([z.literal(0), z.literal(1)])
        })
        .nullable(),
      /** Under `shared`: blocks standing that the seat laid, less those it brought down. */
      score: z.number().int(),
      seatId: seatIdSchema,
      /** Seconds before the seat's floating block drops by itself; `null` while it holds none. */
      secondsLeft: z.number().nonnegative().nullable(),
      /** Won: the best score under `shared`, the tallest tower under `race`. */
      won: z.boolean()
    })
  ),
  /** Whose block floats under `shared`; `null` under `race`, where everyone drops at once. */
  turnSeatId: seatIdSchema.nullable(),
  /** Under `shared`: turns played by the seat who played most, out of each seat's share. */
  turns: z.object({ of: z.number().int(), played: z.number().int() }),
  type: z.literal('tower.state')
})

export type TowerAim = z.infer<typeof towerAimSchema>
export type TowerBlock = z.infer<typeof towerBlockSchema>
export type TowerRule = z.infer<typeof towerRuleSchema>
export type TowerSeatAim = z.infer<typeof towerSeatAimSchema>
export type TowerSeatDrop = z.infer<typeof towerSeatDropSchema>
export type TowerSeatPick = z.infer<typeof towerSeatPickSchema>
export type TowerSeatSpin = z.infer<typeof towerSeatSpinSchema>
export type TowerSeatRuleChoice = z.infer<typeof towerSeatRuleChoiceSchema>
export type TowerState = z.infer<typeof towerStateSchema>
