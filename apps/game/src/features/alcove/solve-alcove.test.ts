import { describe, expect, it } from 'vitest'

import type { AlcoveCalibration } from './alcove-calibration'
import type { AlcoveGeometry } from './alcove-geometry'
import { MEASURED_ALCOVE } from './measured-alcove'
import { projectInAlcove } from './project-in-alcove'
import { SHIPPED_ALCOVE } from './shipped-alcove'
import { solveAlcove } from './solve-alcove'

const KNOWN_BOX: AlcoveGeometry = {
  depth: 1.3,
  eye: { x: -0.04, y: 1.02, z: 4.6 },
  eyeDistance: 2.5,
  fitError: 0,
  height: 1.95,
  principalPoint: { x: 0.47, y: 0.51 }
}

/** The calibration a perfect trace of `geometry` would give. */
const tracedFrom = (geometry: AlcoveGeometry): AlcoveCalibration => {
  const seen = (x: number, y: number, z: number) =>
    projectInAlcove(geometry, { x, y, z })
  const { depth, height } = geometry
  return {
    back: {
      bottomLeft: seen(-0.5, 0, -depth),
      bottomRight: seen(0.5, 0, -depth),
      topLeft: seen(-0.5, height, -depth),
      topRight: seen(0.5, height, -depth)
    },
    eyeDistance: geometry.eyeDistance,
    front: {
      floorLeft: seen(-0.5, 0, 0),
      floorRight: seen(0.5, 0, 0),
      roofLeft: seen(-0.5, height, 0),
      roofRight: seen(0.5, height, 0)
    }
  }
}

describe('solveAlcove', () => {
  it('finds back the box and the eye a perfect trace came from', () => {
    const solved = solveAlcove(tracedFrom(KNOWN_BOX))
    expect(solved.height).toBeCloseTo(KNOWN_BOX.height, 5)
    expect(solved.depth).toBeCloseTo(KNOWN_BOX.depth, 5)
    expect(solved.eye.x).toBeCloseTo(KNOWN_BOX.eye.x, 5)
    expect(solved.eye.y).toBeCloseTo(KNOWN_BOX.eye.y, 5)
    expect(solved.eye.z).toBeCloseTo(KNOWN_BOX.eye.z, 5)
    expect(solved.principalPoint.x).toBeCloseTo(KNOWN_BOX.principalPoint.x, 5)
    expect(solved.principalPoint.y).toBeCloseTo(KNOWN_BOX.principalPoint.y, 5)
    expect(solved.fitError).toBeLessThan(1e-6)
  })

  it('reads the measured alcove as a tall shallow box with the eye near the screen centre', () => {
    const { depth, height, principalPoint } = SHIPPED_ALCOVE
    expect(height).toBeGreaterThan(1.7)
    expect(height).toBeLessThan(2.2)
    expect(depth).toBeGreaterThan(0.5)
    expect(depth).toBeLessThan(2)
    expect(Math.abs(principalPoint.x - 0.5)).toBeLessThan(0.1)
    expect(Math.abs(principalPoint.y - 0.5)).toBeLessThan(0.1)
  })

  it('lands every measured corner within a few hundredths of the screen of its trace', () => {
    const { back, front } = tracedFrom(SHIPPED_ALCOVE)
    const measured = MEASURED_ALCOVE
    const pairs = [
      [measured.back.bottomLeft, back.bottomLeft],
      [measured.back.bottomRight, back.bottomRight],
      [measured.back.topLeft, back.topLeft],
      [measured.back.topRight, back.topRight],
      [measured.front.floorLeft, front.floorLeft],
      [measured.front.floorRight, front.floorRight],
      [measured.front.roofLeft, front.roofLeft],
      [measured.front.roofRight, front.roofRight]
    ] as const
    expect(SHIPPED_ALCOVE.fitError).toBeLessThan(0.03)
    for (const [traced, seen] of pairs) {
      expect(Math.abs(seen.x - traced.x)).toBeLessThan(0.04)
      expect(Math.abs(seen.y - traced.y)).toBeLessThan(0.04)
    }
  })
})
