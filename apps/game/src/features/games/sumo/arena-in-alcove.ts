import {
  type AlcoveInterior,
  alcoveInterior
} from '@/features/alcove/alcove-bounds'
import { SHIPPED_ALCOVE } from '@/features/alcove/shipped-alcove'

import { FLOOR_REACH } from './arena-table'

/** How high over the floor the table's underside stands, in alcove units: the height Adrien approved in mock E (2026-11-26). `ARENA_TABLE.rise` holds it in arena units. */
export const TABLE_LIFT = 0.5

/** Where the arena stands in the alcove: how many alcove units an arena unit spans, and how deep the column's axis meets the floor. */
export type ArenaPlacement = {
  readonly scale: number
  readonly z: number
}

/**
 * Stands the table's column on the measured floor (Adrien chose mock E,
 * 2026-11-26). Seen from the players' eye, the table, its column and their
 * shadows follow the real box's vanishing lines. Its size is the floor's:
 * what falls off the table lands within `FLOOR_REACH`, which spans the depth
 * from the back wall's margin to `floorFront` and stays inside the walls'
 * margin across.
 */
export const placeTableOnColumn = (
  interior: AlcoveInterior
): ArenaPlacement => {
  const back = interior.z.min
  const front = interior.floorFront
  return {
    scale: Math.min((front - back) / 2, interior.x.max) / FLOOR_REACH,
    z: (front + back) / 2
  }
}

export const ARENA_IN_ALCOVE = placeTableOnColumn(
  alcoveInterior(SHIPPED_ALCOVE)
)
