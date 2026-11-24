import { PerspectiveCamera, Vector3 } from 'three'
import { describe, expect, it } from 'vitest'

import { aimAlcoveCamera } from './aim-alcove-camera'
import { screenRectAt } from './alcove-bounds'
import type { CanvasSize } from './alcove-frustum'
import type { AlcovePoint } from './alcove-geometry'
import { DISPLAY_ASPECT } from './display-aspect'
import { projectInAlcove } from './project-in-alcove'
import { SHIPPED_ALCOVE } from './shipped-alcove'

const DISPLAY: CanvasSize = { height: 2560, width: 1440 }
const DESKTOP_WINDOW: CanvasSize = { height: 900, width: 1600 }

const onCanvas = (
  camera: PerspectiveCamera,
  canvas: CanvasSize,
  point: AlcovePoint
) => {
  const projected = new Vector3(point.x, point.y, point.z).project(camera)
  return {
    x: ((projected.x + 1) / 2) * canvas.width,
    y: ((1 - projected.y) / 2) * canvas.height
  }
}

const POINTS: readonly AlcovePoint[] = [
  { x: -0.5, y: 0, z: 0 },
  { x: 0.5, y: SHIPPED_ALCOVE.height, z: -SHIPPED_ALCOVE.depth },
  { x: 0.2, y: 0.7, z: -0.4 },
  { x: -0.3, y: 1.6, z: -1 }
]

describe('aimAlcoveCamera', () => {
  it('draws each point of the scene where the eye sees it on the display', () => {
    const camera = new PerspectiveCamera()
    aimAlcoveCamera(camera, SHIPPED_ALCOVE, DISPLAY)
    for (const point of POINTS) {
      const seen = projectInAlcove(SHIPPED_ALCOVE, point)
      const drawn = onCanvas(camera, DISPLAY, point)
      expect(drawn.x).toBeCloseTo(seen.x * DISPLAY.width, 3)
      expect(drawn.y).toBeCloseTo(seen.y * DISPLAY.height, 3)
    }
  })

  it('lays the display as a centred 9:16 band in a wider window', () => {
    const camera = new PerspectiveCamera()
    aimAlcoveCamera(camera, SHIPPED_ALCOVE, DESKTOP_WINDOW)
    const bandWidth = DESKTOP_WINDOW.height * DISPLAY_ASPECT
    const bandLeft = (DESKTOP_WINDOW.width - bandWidth) / 2
    for (const point of POINTS) {
      const seen = projectInAlcove(SHIPPED_ALCOVE, point)
      const drawn = onCanvas(camera, DESKTOP_WINDOW, point)
      expect(drawn.x).toBeCloseTo(bandLeft + seen.x * bandWidth, 3)
      expect(drawn.y).toBeCloseTo(seen.y * DESKTOP_WINDOW.height, 3)
    }
  })
})

describe('screenRectAt', () => {
  it('shrinks toward the back wall and stays inside the opening', () => {
    const opening = screenRectAt(SHIPPED_ALCOVE, 0)
    const backWall = screenRectAt(SHIPPED_ALCOVE, -SHIPPED_ALCOVE.depth)
    expect(backWall.left).toBeGreaterThan(opening.left)
    expect(backWall.right).toBeLessThan(opening.right)
    expect(backWall.top).toBeGreaterThan(opening.top)
    expect(backWall.bottom).toBeLessThan(opening.bottom)
  })
})
