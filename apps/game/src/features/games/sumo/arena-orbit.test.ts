import { PerspectiveCamera, Vector3 } from 'three'
import { describe, expect, it } from 'vitest'

import { aimArenaCamera } from './aim-arena-camera'
import { frameTheTable } from './arena-camera'
import {
  type ArenaMotion,
  type ArenaOrbit,
  type ArenaStage,
  advanceOrbit,
  STILL_ORBIT,
  stickOnArena
} from './arena-orbit'

const DISPLAY_ROW = { height: 2000, width: 1944 }
const FELT = 0.16

/** Where a point of the felt lands on the canvas, in CSS pixels with `y` growing downward, seen from `azimuth`. */
const onCanvas = (azimuth: number, { x, y }: { x: number; y: number }) => {
  const framing = frameTheTable(DISPLAY_ROW)
  const camera = new PerspectiveCamera(45, 1, 0.1, 60)
  aimArenaCamera(camera, framing, azimuth)
  const ndc = new Vector3(x, FELT, y).project(camera)
  return {
    x: ((ndc.x + 1) / 2) * DISPLAY_ROW.width,
    y: ((1 - ndc.y) / 2) * DISPLAY_ROW.height
  }
}

/** The way a top pushed by `stick` moves across the canvas, as a unit vector. */
const screenCourseOf = (stick: { x: number; y: number }, azimuth: number) => {
  const course = stickOnArena(stick, azimuth)
  const from = onCanvas(azimuth, { x: 0, y: 0 })
  const to = onCanvas(azimuth, { x: course.x * 0.01, y: course.y * 0.01 })
  const length = Math.hypot(to.x - from.x, to.y - from.y)
  return { x: (to.x - from.x) / length, y: (to.y - from.y) / length }
}

const AZIMUTHS = [0, 0.4, Math.PI / 2, 2.5, Math.PI, -1.2]

describe('stickOnArena', () => {
  it('leaves the stick alone from the room’s side', () => {
    expect(stickOnArena({ x: 0.3, y: -0.8 }, 0)).toEqual({ x: 0.3, y: -0.8 })
  })

  it('keeps the stick’s length', () => {
    const turned = stickOnArena({ x: 0.6, y: 0.8 }, 2.1)
    expect(Math.hypot(turned.x, turned.y)).toBeCloseTo(1)
  })

  it.each(AZIMUTHS)(
    'sends a top right on screen when the stick goes right, the camera at %f rad',
    (azimuth) => {
      const course = screenCourseOf({ x: 1, y: 0 }, azimuth)
      expect(course.x).toBeCloseTo(1, 1)
      expect(Math.abs(course.y)).toBeLessThan(0.2)
    }
  )

  it.each(AZIMUTHS)(
    'sends a top away from the viewer, up the screen, when the stick goes up, the camera at %f rad',
    (azimuth) => {
      const course = screenCourseOf({ x: 0, y: -1 }, azimuth)
      expect(course.y).toBeCloseTo(-1, 1)
      expect(Math.abs(course.x)).toBeLessThan(0.2)
    }
  )
})

const ORBITING: ArenaMotion = {
  orbit: 'waiting',
  orbitDegreesPerSecond: 30,
  swayDegrees: 10
}

const run = (
  motion: ArenaMotion,
  stage: ArenaStage,
  seconds: number,
  from: ArenaOrbit = STILL_ORBIT
) => {
  let orbit = from
  for (let step = 0; step < seconds * 60; step++) {
    orbit = advanceOrbit(orbit, { motion, seconds: 1 / 60, stage })
  }
  return orbit
}

const degreesOf = (radians: number) => (radians * 180) / Math.PI

describe('advanceOrbit', () => {
  it('holds the camera on the room’s side with the orbit off and no sway', () => {
    const motion = { ...ORBITING, orbit: 'off', swayDegrees: 0 } as const
    expect(run(motion, 'waiting', 3).azimuth).toBe(0)
    expect(run(motion, 'playing', 3).azimuth).toBe(0)
  })

  it('circles the drum at the orbit speed while the room waits', () => {
    expect(degreesOf(run(ORBITING, 'waiting', 2).azimuth)).toBeCloseTo(60, 3)
  })

  it('keeps the azimuth within a half turn each way', () => {
    const azimuth = run(ORBITING, 'waiting', 10).azimuth
    expect(Math.abs(azimuth)).toBeLessThanOrEqual(Math.PI)
  })

  it('sways within its amplitude during play, after heading back to the room’s side', () => {
    const turned = run(ORBITING, 'waiting', 5)
    let orbit = run(ORBITING, 'playing', 4, turned)
    let widest = 0
    for (let step = 0; step < 20 * 60; step++) {
      orbit = advanceOrbit(orbit, {
        motion: ORBITING,
        seconds: 1 / 60,
        stage: 'playing'
      })
      widest = Math.max(widest, Math.abs(degreesOf(orbit.azimuth)))
    }
    expect(widest).toBeLessThanOrEqual(10.01)
    expect(widest).toBeGreaterThan(9)
  })

  it('sways in play with the orbit off, and stays still while the room waits', () => {
    const motion = { ...ORBITING, orbit: 'off' } as const
    expect(run(motion, 'waiting', 3).azimuth).toBe(0)
    expect(run(motion, 'playing', 1.5).azimuth).not.toBe(0)
  })

  it('keeps circling during play when the orbit is always on', () => {
    const motion = { ...ORBITING, orbit: 'always' } as const
    expect(degreesOf(run(motion, 'playing', 2).azimuth)).toBeCloseTo(60, 3)
  })
})
