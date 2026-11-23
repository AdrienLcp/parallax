import { describe, expect, it } from 'vitest'

import {
  ARENA_PLAN,
  type ArenaFraming,
  frameTheTable,
  projectOnCanvas
} from './arena-camera'

const PORTRAIT = { height: 565, width: 508 }
const LANDSCAPE = { height: 376, width: 507.6 }

const outlineOf = (framing: ArenaFraming, radius: number) =>
  Array.from({ length: 360 }, (_, degree) => {
    const angle = (degree * Math.PI) / 180
    return projectOnCanvas(framing, {
      x: Math.cos(angle) * radius,
      z: Math.sin(angle) * radius
    })
  })

const extentOf = (points: readonly { x: number; y: number }[]) => ({
  bottom: Math.max(...points.map(({ y }) => y)),
  left: Math.min(...points.map(({ x }) => x)),
  right: Math.max(...points.map(({ x }) => x)),
  top: Math.min(...points.map(({ y }) => y))
})

describe('projectOnCanvas', () => {
  it('puts the platform centre at the canvas centre, where the camera looks', () => {
    const framing = frameTheTable(PORTRAIT)
    const centre = projectOnCanvas(framing, { x: 0, z: 0 })
    expect(centre.x).toBeCloseTo(PORTRAIT.width / 2)
    expect(centre.y).toBeCloseTo(PORTRAIT.height / 2)
  })

  it('draws the rim nearer the room larger, so the platform sits a little low', () => {
    const framing = frameTheTable(PORTRAIT)
    const centre = PORTRAIT.height / 2
    const near = projectOnCanvas(framing, { x: 0, z: ARENA_PLAN.rim })
    const far = projectOnCanvas(framing, { x: 0, z: -ARENA_PLAN.rim })
    expect(near.y - centre).toBeGreaterThan(centre - far.y)
    expect((near.y + far.y) / 2).toBeGreaterThan(centre)
  })
})

describe('frameTheTable', () => {
  it('frames by width in portrait and by height in landscape', () => {
    const portrait = frameTheTable(PORTRAIT)
    const landscape = frameTheTable(LANDSCAPE)
    expect(portrait.halfHorizontal).toBeLessThan(portrait.halfVertical)
    expect(landscape.halfHorizontal).toBeGreaterThan(landscape.halfVertical)
    expect(portrait.distance * Math.tan(portrait.halfHorizontal)).toBeCloseTo(
      landscape.distance * Math.tan(landscape.halfVertical)
    )
  })

  it.each([
    ['portrait', PORTRAIT],
    ['landscape', LANDSCAPE]
  ])(
    'keeps the whole gutter inside a %s canvas, with room around it',
    (_, canvas) => {
      const gutter = extentOf(
        outlineOf(frameTheTable(canvas), ARENA_PLAN.gutter)
      )
      expect(gutter.left).toBeGreaterThan(0)
      expect(gutter.right).toBeLessThan(canvas.width)
      expect(gutter.top).toBeGreaterThan(0)
      expect(gutter.bottom).toBeLessThan(canvas.height)
      expect(
        Math.min(gutter.right - gutter.left, gutter.bottom - gutter.top) /
          Math.min(canvas.width, canvas.height)
      ).toBeLessThan(1 / 1.06)
    }
  )
})
