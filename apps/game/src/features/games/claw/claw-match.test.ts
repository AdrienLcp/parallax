import { describe, expect, it } from 'vitest'

import type { SeatId } from '@parallax/protocol/identifiers'

import { alcoveInterior } from '@/features/alcove/alcove-bounds'
import { SHIPPED_ALCOVE } from '@/features/alcove/shipped-alcove'

import {
  type ClawMatch,
  type ClawMatchStep,
  type ClawStick,
  createClawMatch
} from './claw-match'
import { CLAW_REACH, clawPit, PLUSH_RADIUS } from './claw-pit'
import { CLAW_STEP_SECONDS, CLAW_TUNING } from './claw-tuning'

const INTERIOR = alcoveInterior(SHIPPED_ALCOVE)
const PIT = clawPit(SHIPPED_ALCOVE, INTERIOR)
const ANA: SeatId = 'seat-ana'
const BEN: SeatId = 'seat-ben'
const BOTH = new Set([ANA, BEN])

/** A seeded random, so every run deals the same pile. */
const seeded = (seed: number) => {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const stepOf = (
  partial: Partial<ClawMatchStep> & { sticks?: Map<SeatId, ClawStick> }
): ClawMatchStep => ({
  drops: new Set(),
  seated: BOTH,
  sticks: new Map(),
  ...partial
})

const runFor = (match: ClawMatch, seconds: number, step = stepOf({})) => {
  let isOver = false
  for (let t = 0; t < seconds && !isOver; t += CLAW_STEP_SECONDS) {
    isOver = match.advance(step)
  }
  return isOver
}

const clawOf = (match: ClawMatch, seat: SeatId) => {
  const claw = match.view().claws.find((candidate) => candidate.seat === seat)
  if (claw === undefined) throw new Error(`no claw for ${seat}`)
  return claw
}

describe('the pit', () => {
  it('keeps every prize and every claw inside the alcove interior', () => {
    const match = createClawMatch({
      pit: PIT,
      random: seeded(3),
      seats: [ANA, BEN]
    })
    for (const prize of match.view().prizes) {
      expect(Math.abs(prize.x) + PLUSH_RADIUS * 1.05).toBeLessThanOrEqual(
        INTERIOR.x.max + 1e-9
      )
      expect(prize.z - PLUSH_RADIUS * 1.05).toBeGreaterThanOrEqual(
        INTERIOR.z.min - 1e-9
      )
      expect(prize.z + PLUSH_RADIUS * 1.05).toBeLessThanOrEqual(
        INTERIOR.floorFront + 1e-9
      )
    }
    const far = new Map([[ANA, { x: 1, z: 1 }]])
    runFor(match, 4, stepOf({ sticks: far }))
    const claw = clawOf(match, ANA)
    expect(claw.x + CLAW_REACH).toBeLessThanOrEqual(INTERIOR.x.max + 1e-9)
    expect(claw.z + CLAW_REACH).toBeLessThanOrEqual(INTERIOR.floorFront + 1e-9)
  })

  it('hangs the rails against the real roof and inside the walls', () => {
    expect(PIT.rail.y).toBeLessThan(SHIPPED_ALCOVE.height)
    expect(PIT.rail.halfX).toBe(INTERIOR.x.max)
    expect(PIT.rail.back).toBe(INTERIOR.z.min)
  })

  it('deals a full pile with some capsules in it', () => {
    const { prizes } = createClawMatch({
      pit: PIT,
      random: seeded(5),
      seats: [ANA]
    }).view()
    expect(prizes.length).toBeGreaterThan(30)
    expect(prizes.length).toBeLessThanOrEqual(CLAW_TUNING.pileCount)
    expect(prizes.some((prize) => prize.kind === 'capsule')).toBe(true)
  })
})

describe('a claw', () => {
  it('moves with its stick and stays put without one', () => {
    const match = createClawMatch({
      pit: PIT,
      random: seeded(1),
      seats: [ANA, BEN]
    })
    const before = { ...clawOf(match, ANA) }
    runFor(match, 0.5, stepOf({ sticks: new Map([[ANA, { x: 0, z: -1 }]]) }))
    const after = clawOf(match, ANA)
    expect(after.z).toBeCloseTo(before.z - CLAW_TUNING.aimSpeed * 0.5, 1)
    expect(after.x).toBeCloseTo(before.x, 5)
  })

  it('drops, grips what lies under it, and scores it in a chute', () => {
    // A random that never makes a prize slip: every grip holds.
    let calls = 0
    const deal = seeded(9)
    const random = () => {
      calls += 1
      return calls > 400 ? 0.99 : deal()
    }
    const match = createClawMatch({ pit: PIT, random, seats: [ANA, BEN] })
    const claw = clawOf(match, ANA)
    const target = match
      .view()
      .prizes.filter(
        (prize) =>
          prize.x > PIT.reach.minX &&
          prize.x < PIT.reach.maxX &&
          prize.z > PIT.reach.minZ &&
          prize.z < PIT.reach.maxZ
      )
      .sort((a, b) => b.y - a.y)[0]
    if (target === undefined) throw new Error('no prize in reach')
    claw.x = target.x
    claw.z = target.z
    match.advance(stepOf({ drops: new Set([ANA]) }))
    expect(claw.phase).toBe('drop')
    runFor(match, 12)
    expect(claw.phase).toBe('aim')
    expect(claw.score).toBeGreaterThan(0)
    expect(match.view().lastCatch?.seat).toBe(ANA)
  })

  it('ignores a drop once time is up', () => {
    const match = createClawMatch({
      pit: PIT,
      random: seeded(2),
      seats: [ANA, BEN]
    })
    runFor(match, CLAW_TUNING.roundSeconds)
    match.advance(stepOf({ drops: new Set([ANA]) }))
    expect(clawOf(match, ANA).phase).toBe('aim')
  })

  it('keeps clear of another claw', () => {
    const match = createClawMatch({
      pit: PIT,
      random: seeded(4),
      seats: [ANA, BEN]
    })
    const towards = new Map([
      [ANA, { x: 1, z: 0 }],
      [BEN, { x: -1, z: 0 }]
    ])
    runFor(match, 3, stepOf({ sticks: towards }))
    const a = clawOf(match, ANA)
    const b = clawOf(match, BEN)
    expect(Math.hypot(a.x - b.x, a.z - b.z)).toBeGreaterThanOrEqual(
      CLAW_TUNING.clawGap - 1e-6
    )
  })
})

describe('the round', () => {
  it('ends after its time and the pause, nobody winning without a catch', () => {
    const match = createClawMatch({
      pit: PIT,
      random: seeded(6),
      seats: [ANA, BEN]
    })
    expect(runFor(match, CLAW_TUNING.roundSeconds - 1)).toBe(false)
    runFor(match, 1.1)
    expect(match.view().outcome).toEqual({ winners: [] })
    expect(runFor(match, CLAW_TUNING.decidedPauseSeconds + 0.1)).toBe(true)
  })

  it('gives the win to the best score', () => {
    const match = createClawMatch({
      pit: PIT,
      random: seeded(7),
      seats: [ANA, BEN]
    })
    clawOf(match, BEN).score = 4
    clawOf(match, ANA).score = 1
    runFor(match, CLAW_TUNING.roundSeconds + 0.1)
    expect(match.view().outcome).toEqual({ winners: [BEN] })
  })

  it('drops a player whose seat is gone, and ends with nobody left', () => {
    const match = createClawMatch({
      pit: PIT,
      random: seeded(8),
      seats: [ANA, BEN]
    })
    match.advance(stepOf({ seated: new Set([ANA]) }))
    expect(match.view().claws.map((claw) => claw.seat)).toEqual([ANA])
    expect(match.advance(stepOf({ seated: new Set() }))).toBe(true)
  })
})
