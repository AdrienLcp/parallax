import { describe, expect, it } from 'vitest'

import type { DrawnTop } from './arena-frame'
import { SHIPPED_HEIGHTS } from './arena-shape'
import { ARENA_TABLE } from './arena-table'
import { SUMO_TUNING } from './sumo-tuning'
import { hopHeightOf, LANDING_RADIUS, topPoseOf } from './top-pose'

const FELT = SHIPPED_HEIGHTS.surfaceHeight

const drawnTop = (overrides: Partial<DrawnTop>): DrawnTop => ({
  fall: 0,
  isAbsent: false,
  isDashRecharging: false,
  jump: 0,
  position: { x: 0.3, y: -0.2 },
  slot: 0,
  velocity: { x: 0, y: 0 },
  ...overrides
})

describe('topPoseOf', () => {
  it('stands a live top upright on the felt where the physics puts it', () => {
    const pose = topPoseOf(drawnTop({}))
    expect(pose).toMatchObject({ lean: 0, spinShare: 1, x: 0.3, z: -0.2 })
    expect(pose.y).toBe(FELT)
  })

  it('leans a moving top toward its course, never past its most lean', () => {
    const pose = topPoseOf(drawnTop({ velocity: { x: 0, y: 5 } }))
    expect(pose.heading).toBeCloseTo(Math.PI / 2)
    expect(pose.lean).toBeCloseTo(0.3)
  })

  it('lifts a jumping top upright over the felt, highest halfway through its airtime', () => {
    const pose = topPoseOf(drawnTop({ jump: 0.5, velocity: { x: 0, y: 5 } }))
    expect(pose.y).toBeCloseTo(FELT + SUMO_TUNING.jumpHeight)
    expect(pose.lean).toBe(0)
    expect(hopHeightOf(0.2)).toBeLessThan(hopHeightOf(0.5))
    expect(hopHeightOf(1)).toBe(0)
  })

  it('lands a fallen top on the floor just clear of the edge, outward of where it left', () => {
    const pose = topPoseOf(
      drawnTop({
        fall: 1,
        position: { x: 0, y: 1.6 },
        velocity: { x: 0, y: 2 }
      })
    )
    expect(pose.x).toBeCloseTo(0)
    expect(pose.z).toBeCloseTo(LANDING_RADIUS)
    expect(pose.y).toBeCloseTo(0)
    expect(LANDING_RADIUS).toBeGreaterThan(
      ARENA_TABLE.edgeRadius + SUMO_TUNING.topRadius
    )
    expect(pose.spinShare).toBeLessThan(0.2)
  })

  it('slides a falling top past the edge before it drops, then drops it faster and faster to the floor', () => {
    const poses = [0.1, 0.2, 0.4, 0.6, 0.8, 1].map((fall) =>
      topPoseOf(drawnTop({ fall, position: { x: 1.01, y: 0 } }))
    )
    expect(poses[0]?.y).toBe(FELT)
    const heights = poses.map(({ y }) => y)
    for (const [index, height] of heights.slice(1).entries()) {
      expect(height).toBeLessThanOrEqual(heights[index] ?? 0)
    }
    const firstDrop = poses.findIndex(({ y }) => y < FELT)
    expect(poses[firstDrop]?.x).toBeGreaterThan(ARENA_TABLE.edgeRadius)
    expect(heights.at(-1)).toBeCloseTo(0)
  })
})
