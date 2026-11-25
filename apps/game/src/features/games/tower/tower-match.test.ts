import RAPIER from '@dimforge/rapier3d-compat'
import { beforeAll, describe, expect, it } from 'vitest'

import type { SeatId } from '@parallax/protocol/identifiers'
import type { TowerRule } from '@parallax/protocol/tower'

import { alcoveInterior } from '@/features/alcove/alcove-bounds'
import { SHIPPED_ALCOVE } from '@/features/alcove/shipped-alcove'

import {
  createTowerMatch,
  laneLayout,
  type TowerAim,
  type TowerMatch,
  type TowerMatchStep
} from './tower-match'
import { createTowerPhysics } from './tower-physics'
import { TOWER_STEP_SECONDS, TOWER_TUNING } from './tower-tuning'

const INTERIOR = alcoveInterior(SHIPPED_ALCOVE)
const ANA = 'seat-ana'
const BEN = 'seat-ben'
const BOTH = new Set([ANA, BEN])

beforeAll(async () => {
  await RAPIER.init()
})

/** Every block drawn is a cube: the rules, not the luck of the draw, are under test. */
const CUBES = () => 0.4

const matchOf = (rule: TowerRule) =>
  createTowerMatch({
    interior: INTERIOR,
    physics: createTowerPhysics(RAPIER, INTERIOR),
    random: CUBES,
    rule,
    seats: [ANA, BEN]
  })

const idle: TowerMatchStep = {
  aims: new Map(),
  drops: new Set(),
  present: BOTH,
  seated: BOTH
}

const run = (
  match: TowerMatch,
  seconds: number,
  step: Partial<TowerMatchStep> = {}
) => {
  let isOver = false
  for (let t = 0; t < seconds / TOWER_STEP_SECONDS && !isOver; t += 1) {
    isOver = match.advance({ ...idle, ...step })
  }
  return isOver
}

const dropBy = (match: TowerMatch, seat: SeatId) => {
  match.advance({ ...idle, drops: new Set([seat]) })
  run(match, 2)
}

const aimBy = (
  match: TowerMatch,
  seat: SeatId,
  aim: TowerAim,
  seconds: number
) => run(match, seconds, { aims: new Map([[seat, aim]]) })

describe('createTowerMatch, shared', () => {
  it('hands the block to each player in turn, the tower growing with each drop', () => {
    const match = matchOf('shared')
    match.advance(idle)
    expect(match.view().lanes[0]?.floating?.seat).toBe(ANA)

    dropBy(match, ANA)
    match.advance(idle)
    expect(match.view().lanes[0]?.floating?.seat).toBe(BEN)

    dropBy(match, BEN)
    const lane = match.view().lanes[0]
    expect(lane?.blocks).toHaveLength(2)
    expect(lane?.height).toBeGreaterThan(1.9 * TOWER_TUNING.sharedUnit)
    expect(match.view().outcome).toBeNull()
  })

  it('makes whoever drops a block beside the tower lose', () => {
    const match = matchOf('shared')
    match.advance(idle)
    dropBy(match, ANA)
    match.advance(idle)
    aimBy(match, BEN, { x: 1, z: 0 }, 1)
    dropBy(match, BEN)

    expect(match.view().outcome).toEqual({ kind: 'toppled', seat: BEN })
  })

  it('skips an absent player and ends once fewer than two remain seated', () => {
    const match = matchOf('shared')
    match.advance({ ...idle, present: new Set([BEN]) })
    expect(match.view().lanes[0]?.floating?.seat).toBe(BEN)

    expect(match.advance({ ...idle, seated: new Set([BEN]) })).toBe(true)
  })

  it('drops the block by itself once the turn runs out', () => {
    const match = matchOf('shared')
    run(match, TOWER_TUNING.turnSeconds + 0.1)

    expect(match.view().lanes[0]?.blocks).toHaveLength(1)
  })

  it('keeps the floating block inside the interior, however long the stick pushes', () => {
    const match = matchOf('shared')
    match.advance(idle)
    aimBy(match, ANA, { x: -1, z: 1 }, 5)

    const floating = match.view().lanes[0]?.floating
    expect(floating?.x).toBeGreaterThan(INTERIOR.x.min)
    expect(floating?.z).toBeLessThan(INTERIOR.floorFront)
  })
})

describe('createTowerMatch, race', () => {
  it('lays one lane per player, side by side within the interior', () => {
    const lanes = laneLayout({
      interior: INTERIOR,
      rule: 'race',
      seats: [ANA, BEN]
    })

    expect(lanes.map((lane) => lane.seats)).toEqual([[ANA], [BEN]])
    expect(lanes[0]?.centre.x).toBeLessThan(0)
    expect(lanes[1]?.centre.x).toBeGreaterThan(0)
  })

  it('lets everyone drop at once, and crowns the tallest when time is up', () => {
    const match = matchOf('race')
    match.advance(idle)
    match.advance({ ...idle, drops: BOTH })
    run(match, 2)
    match.advance(idle)
    dropBy(match, ANA)

    run(match, TOWER_TUNING.raceSeconds)
    expect(match.view().outcome).toEqual({ kind: 'tallest', seat: ANA })
  })
})
