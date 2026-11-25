import { describe, expect, it } from 'vitest'

import { ALCOVE_MARGIN, alcoveInterior, screenRectAt } from './alcove-bounds'
import { DISPLAY_ASPECT } from './display-aspect'
import { projectInAlcove } from './project-in-alcove'
import { SHIPPED_ALCOVE } from './shipped-alcove'

const interior = alcoveInterior(SHIPPED_ALCOVE)
const opening = screenRectAt(SHIPPED_ALCOVE, 0)
const backWall = screenRectAt(SHIPPED_ALCOVE, -SHIPPED_ALCOVE.depth)
/** The margin across the display, as a share of its width: the same pixels as `ALCOVE_MARGIN` down it. */
const MARGIN_ACROSS = ALCOVE_MARGIN / DISPLAY_ASPECT
const PRECISION = 9

describe('alcoveInterior', () => {
  it('keeps the margin inside the back wall, where the walls and the roof show smallest', () => {
    const topLeft = projectInAlcove(SHIPPED_ALCOVE, {
      x: interior.x.min,
      y: interior.y.max,
      z: -SHIPPED_ALCOVE.depth
    })
    const right = projectInAlcove(SHIPPED_ALCOVE, {
      x: interior.x.max,
      y: 0,
      z: -SHIPPED_ALCOVE.depth
    })
    expect(topLeft.x - backWall.left).toBeCloseTo(MARGIN_ACROSS, PRECISION)
    expect(backWall.right - right.x).toBeCloseTo(MARGIN_ACROSS, PRECISION)
    expect(topLeft.y - backWall.top).toBeCloseTo(ALCOVE_MARGIN, PRECISION)
  })

  it('keeps at least the margin inside the opening for anything off the floor', () => {
    const topLeft = projectInAlcove(SHIPPED_ALCOVE, {
      x: interior.x.min,
      y: interior.y.max,
      z: interior.z.max
    })
    const topRight = projectInAlcove(SHIPPED_ALCOVE, {
      x: interior.x.max,
      y: interior.y.max,
      z: interior.z.max
    })
    expect(topLeft.x - opening.left).toBeGreaterThan(MARGIN_ACROSS)
    expect(opening.right - topRight.x).toBeGreaterThan(MARGIN_ACROSS)
    expect(topLeft.y - opening.top).toBeGreaterThan(ALCOVE_MARGIN)
  })

  it('stands floor objects far enough back that the opening edge shows the margin below them', () => {
    const floorFront = projectInAlcove(SHIPPED_ALCOVE, {
      x: 0,
      y: 0,
      z: interior.floorFront
    })
    const openingFloor = projectInAlcove(SHIPPED_ALCOVE, { x: 0, y: 0, z: 0 })
    expect(openingFloor.y - floorFront.y).toBeCloseTo(ALCOVE_MARGIN, PRECISION)
    expect(interior.floorFront).toBeLessThan(interior.z.max)
  })

  it('leaves the floor to the objects resting on it', () => {
    expect(interior.y.min).toBe(0)
  })
})
