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

/**
 * The two ways to play, picked in the lobby: one tower built in turns, where
 * whoever topples it loses, or one tower each racing for height.
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

export const towerSeatRuleChoiceSchema = towerRuleChoiceSchema.extend({
  seatId: seatIdSchema
})

/** The blocks drawn at random, one at a time. */
export const towerBlockSchema = z.enum([
  'plank',
  'cube',
  'cylinder',
  'arch',
  'triangle'
])

/**
 * What the screen, which runs the physics, tells the phones: a few times a
 * second at most, never the positions, only what a phone draws.
 */
export const towerStateSchema = z.object({
  /**
   * `aiming`: a block floats, waiting to be dropped; `settling`: the dropped
   * block is still moving; `decided`: the tower fell, or the race is over.
   */
  phase: z.enum(['lobby', 'aiming', 'settling', 'decided']),
  rule: towerRuleSchema,
  seats: z.array(
    z.object({
      /** Height of the seat's tower in centimetres on the chart; the shared tower's height under `shared`. */
      heightCm: z.number().nonnegative(),
      /** The block this seat drops next; `null` while it is not its turn under `shared`. */
      nextBlock: towerBlockSchema.nullable(),
      seatId: seatIdSchema,
      /** Toppled the shared tower, or its own under `race`. */
      toppled: z.boolean()
    })
  ),
  /** Whose block floats under `shared`; `null` under `race`, where everyone drops at once. */
  turnSeatId: seatIdSchema.nullable(),
  type: z.literal('tower.state')
})

export type TowerAim = z.infer<typeof towerAimSchema>
export type TowerBlock = z.infer<typeof towerBlockSchema>
export type TowerRule = z.infer<typeof towerRuleSchema>
export type TowerSeatAim = z.infer<typeof towerSeatAimSchema>
export type TowerSeatDrop = z.infer<typeof towerSeatDropSchema>
export type TowerSeatRuleChoice = z.infer<typeof towerSeatRuleChoiceSchema>
export type TowerState = z.infer<typeof towerStateSchema>
