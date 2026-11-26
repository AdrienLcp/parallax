import * as RAPIER from '@dimforge/rapier3d'
import { describe, expect, it } from 'vitest'

import { alcoveInterior } from '@/features/alcove/alcove-bounds'
import { SHIPPED_ALCOVE } from '@/features/alcove/shipped-alcove'

import { blockExtent } from './tower-blocks'
import { createTowerPhysics, type TowerPhysics } from './tower-physics'

const INTERIOR = alcoveInterior(SHIPPED_ALCOVE)
const U = 0.105
const Z = (INTERIOR.z.min + INTERIOR.floorFront) / 2

const settle = (physics: TowerPhysics, seconds = 3) => {
  for (let step = 0; step < seconds * 120; step += 1) {
    physics.step()
  }
}

describe('createTowerPhysics', () => {
  it('stands a stack of planks and cubes dropped one on the other', () => {
    const physics = createTowerPhysics(RAPIER, INTERIOR)
    const kinds = ['plank', 'cube', 'plank', 'cube', 'plank', 'cube'] as const
    const handles: number[] = []
    let top = 0
    for (const kind of kinds) {
      const extent = blockExtent(kind, U, 0)
      handles.push(
        physics.drop({
          kind,
          u: U,
          x: 0,
          y: top + extent.below + 0.02,
          yaw: 0,
          z: Z
        })
      )
      settle(physics, 1.5)
      top = Math.max(...handles.map((handle) => physics.reach(handle).top))
    }

    const expected = kinds.reduce((sum, kind) => {
      const extent = blockExtent(kind, U, 0)
      return sum + extent.above + extent.below
    }, 0)
    // Rapier lets each contact sink about a millimetre.
    expect(Math.abs(top - expected)).toBeLessThan(0.01)
    expect(handles.every((handle) => physics.isStill(handle))).toBe(true)
    physics.dispose()
  })

  it('lets a block dropped off the edge of a plank fall to the floor', () => {
    const physics = createTowerPhysics(RAPIER, INTERIOR)
    physics.drop({ kind: 'cube', u: U, x: 0, y: U / 2, yaw: 0, z: Z })
    settle(physics, 1)
    const over = physics.drop({
      kind: 'plank',
      u: U,
      x: 0.17,
      y: U + 0.3 * U + 0.02,
      yaw: 0,
      z: Z
    })
    settle(physics)

    expect(physics.reach(over).bottom).toBeLessThan(0.01)
    physics.dispose()
  })

  it('keeps a falling block inside the interior', () => {
    const physics = createTowerPhysics(RAPIER, INTERIOR)
    const thrown = physics.drop({
      kind: 'plank',
      u: U,
      x: INTERIOR.x.max - 0.16,
      y: 0.5,
      yaw: 0.4,
      z: INTERIOR.floorFront - 0.06
    })
    settle(physics)

    const { position } = physics.pose(thrown)
    expect(position.x).toBeLessThan(INTERIOR.x.max)
    expect(position.z).toBeLessThan(INTERIOR.floorFront)
    expect(position.y).toBeGreaterThan(0)
    physics.dispose()
  })

  it('finds the surface under a point: the top of a block, else the floor', () => {
    const physics = createTowerPhysics(RAPIER, INTERIOR)
    physics.drop({ kind: 'cube', u: U, x: 0, y: U / 2, yaw: 0, z: Z })
    settle(physics, 1)

    expect(physics.surfaceBelow({ x: 0, y: 1, z: Z })).toBeCloseTo(U, 2)
    expect(physics.surfaceBelow({ x: 0.3, y: 1, z: Z })).toBeCloseTo(0, 3)
    physics.dispose()
  })
})
