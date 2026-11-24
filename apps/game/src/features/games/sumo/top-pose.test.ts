import { describe, expect, it } from 'vitest'

import { ARENA_DRUM, DITCH_FLOOR, DITCH_REST_RADIUS } from './arena-drum'
import type { DrawnTop } from './arena-frame'
import { LYING_LEAN_RADIANS, topPoseOf } from './top-pose'

const drawnTop = (overrides: Partial<DrawnTop>): DrawnTop => ({
  fall: 0,
  isAbsent: false,
  isDashRecharging: false,
  position: { x: 0.3, y: -0.2 },
  slot: 0,
  velocity: { x: 0, y: 0 },
  ...overrides
})

describe('topPoseOf', () => {
  it('stands a live top upright on the felt where the physics puts it', () => {
    const pose = topPoseOf(drawnTop({}))
    expect(pose).toMatchObject({ lean: 0, spinShare: 1, x: 0.3, z: -0.2 })
    expect(pose.y).toBe(ARENA_DRUM.surfaceHeight)
  })

  it('leans a moving top toward its course, never past its most lean', () => {
    const pose = topPoseOf(drawnTop({ velocity: { x: 0, y: 5 } }))
    expect(pose.heading).toBeCloseTo(Math.PI / 2)
    expect(pose.lean).toBeCloseTo(0.3)
  })

  it('lays a fallen top on its side along the middle of the ditch, outward of where it left', () => {
    const pose = topPoseOf(
      drawnTop({
        fall: 1,
        position: { x: 0, y: 1.6 },
        velocity: { x: 0, y: 2 }
      })
    )
    expect(pose.x).toBeCloseTo(0)
    expect(pose.z).toBeCloseTo(DITCH_REST_RADIUS)
    expect(pose.y).toBeCloseTo(DITCH_FLOOR)
    expect(pose.lean).toBeCloseTo(LYING_LEAN_RADIANS)
    expect(Math.abs(Math.cos(pose.heading))).toBeCloseTo(1)
    expect(pose.spinShare).toBeLessThan(0.2)
  })

  it('drops a falling top steadily from the felt into the ditch', () => {
    const heights = [0.1, 0.3, 0.5, 0.7].map(
      (fall) => topPoseOf(drawnTop({ fall, position: { x: 1.02, y: 0 } })).y
    )
    expect(heights[0]).toBeLessThan(ARENA_DRUM.surfaceHeight)
    for (const [index, height] of heights.slice(1).entries()) {
      expect(height).toBeLessThanOrEqual(heights[index] ?? 0)
    }
    expect(heights.at(-1)).toBeCloseTo(DITCH_FLOOR)
  })
})
