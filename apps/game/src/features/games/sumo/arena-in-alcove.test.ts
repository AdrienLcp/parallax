import { describe, expect, it } from 'vitest'

import { alcoveInterior } from '@/features/alcove/alcove-bounds'
import { SHIPPED_ALCOVE } from '@/features/alcove/shipped-alcove'
import { SHAPE_RANGES } from '@/features/display-tuning/display-tuning'

import { ARENA_IN_ALCOVE, TABLE_LIFT } from './arena-in-alcove'
import { heightsOf } from './arena-shape'
import { ARENA_TABLE, FLOOR_REACH } from './arena-table'
import { COLUMN_FOOT_RADIUS } from './column-model'
import { SUMO_TUNING } from './sumo-tuning'
import { LANDING_RADIUS } from './top-pose'

const interior = alcoveInterior(SHIPPED_ALCOVE)
const { scale, z } = ARENA_IN_ALCOVE
const tallest = heightsOf({
  drumHeightScale: SHAPE_RANGES.drumHeightScale.highest,
  topHeightScale: SHAPE_RANGES.topHeightScale.highest
})
/** How far from the column's axis anything of the arena reaches: the column's foot, the table's edge, a top at the rim, a top landing on the floor. */
const reaches = [
  COLUMN_FOOT_RADIUS,
  ARENA_TABLE.edgeRadius,
  SUMO_TUNING.arenaRadius + SUMO_TUNING.topRadius,
  LANDING_RADIUS + SUMO_TUNING.topRadius
]
const TOLERANCE = 1e-9

describe('ARENA_IN_ALCOVE', () => {
  it('keeps the whole arena behind the floor front and inside the back wall', () => {
    for (const reach of [...reaches, FLOOR_REACH]) {
      expect(z + reach * scale).toBeLessThanOrEqual(
        interior.floorFront + TOLERANCE
      )
      expect(z - reach * scale).toBeGreaterThanOrEqual(
        interior.z.min - TOLERANCE
      )
    }
  })

  it('keeps the whole arena inside the walls', () => {
    for (const reach of [...reaches, FLOOR_REACH]) {
      expect(reach * scale).toBeLessThanOrEqual(interior.x.max + TOLERANCE)
    }
  })

  it('lands every fallen top inside the floor reach', () => {
    expect(LANDING_RADIUS + SUMO_TUNING.topRadius).toBeLessThan(FLOOR_REACH)
  })

  it('stands the table with its underside at the approved lift, the column on the floor', () => {
    expect(ARENA_TABLE.rise * scale).toBeCloseTo(TABLE_LIFT, 2)
  })

  it('keeps the tallest tuned top at the top of its hop under the roof', () => {
    expect(
      (tallest.surfaceHeight + tallest.topHeight + SUMO_TUNING.jumpHeight) *
        scale
    ).toBeLessThan(interior.y.max)
  })

  it('stands the table as large as the depth allows, its floor reach touching both bounds', () => {
    expect(z + FLOOR_REACH * scale).toBeCloseTo(interior.floorFront, 9)
    expect(z - FLOOR_REACH * scale).toBeCloseTo(interior.z.min, 9)
  })
})
