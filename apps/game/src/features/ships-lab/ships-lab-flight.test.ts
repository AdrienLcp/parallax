import { describe, expect, it } from 'vitest'

import { alcoveInterior } from '@/features/alcove/alcove-bounds'
import { SHIPPED_ALCOVE } from '@/features/alcove/shipped-alcove'

import {
  advanceFlight,
  createFlightWorld,
  type FlightPad,
  IDLE_PAD
} from './ships-lab-flight'

const INTERIOR = alcoveInterior(SHIPPED_ALCOVE)

const fly = (
  world: ReturnType<typeof createFlightWorld>,
  pad: FlightPad,
  seconds: number
) => {
  for (let elapsed = 0; elapsed < seconds; elapsed += 1 / 60) {
    advanceFlight(world, pad, 1 / 60)
  }
}

describe('ships lab flight', () => {
  it('flies on by itself in auto, into the alcove when the stick points up', () => {
    const world = createFlightWorld('auto', INTERIOR)
    const start = world.ship.position.z
    fly(world, { ...IDLE_PAD, left: { x: 0, y: -1 } }, 1)
    expect(world.ship.position.z).toBeLessThan(start - 0.05)
  })

  it('turns auto towards the players when the stick points down', () => {
    const world = createFlightWorld('auto', INTERIOR)
    fly(world, { ...IDLE_PAD, left: { x: 0, y: 1 } }, 2)
    expect(world.ship.forward.z).toBeGreaterThan(0.9)
  })

  it('fires on its own in auto at a target in front of the nose', () => {
    const world = createFlightWorld('auto', INTERIOR)
    const target = world.targets[0]
    if (target === undefined) throw new Error('no target')
    target.home.copy(world.ship.position).add({ x: 0, y: 0, z: -0.3 })
    fly(world, IDLE_PAD, 0.3)
    expect(world.shots).toBeGreaterThan(0)
  })

  it('points the nose where the phone points in gyro', () => {
    const world = createFlightWorld('gyro', INTERIOR)
    fly(world, { ...IDLE_PAD, right: { x: 0.5, y: 0 } }, 1)
    expect(world.ship.forward.x).toBeGreaterThan(0.99)
    fly(world, { ...IDLE_PAD, right: { x: 0, y: -0.5 } }, 1)
    expect(world.ship.forward.y).toBeGreaterThan(0.6)
  })

  it('moves in depth with the left stick in depth, height with the buttons', () => {
    const world = createFlightWorld('depth', INTERIOR)
    const start = world.ship.position.clone()
    fly(world, { ...IDLE_PAD, depth: 1, left: { x: 0, y: -1 } }, 0.4)
    expect(world.ship.position.z).toBeLessThan(start.z - 0.05)
    expect(world.ship.position.y).toBeGreaterThan(start.y + 0.02)
  })
})
