import { PerspectiveCamera, Vector3 } from 'three'
import { describe, expect, it } from 'vitest'

import { aimArenaCamera } from './aim-arena-camera'
import {
  type ArenaFraming,
  CAMERA_TARGET_HEIGHT,
  FRAME_FILL,
  FRAMED_RINGS,
  framedRingsOf,
  frameTheTable,
  projectOnCanvas,
  SHIPPED_LENS
} from './arena-camera'
import { ARENA_DRUM, DITCH_FLOOR, DRUM_LIP_TOP } from './arena-drum'

const PORTRAIT_ROW = { height: 520, width: 506 }
const TALL_ROW = { height: 2000, width: 1944 }
const LANDSCAPE = { height: 376, width: 507.6 }
const WIDE_STRIP = { height: 300, width: 1200 }

const ringOf = (
  framing: ArenaFraming,
  { radius, y }: { radius: number; y: number }
) =>
  Array.from({ length: 360 }, (_, degree) => {
    const angle = (degree * Math.PI) / 180
    return projectOnCanvas(
      framing,
      { x: Math.cos(angle) * radius, z: Math.sin(angle) * radius },
      y
    )
  })

const drumOutlineOf = (framing: ArenaFraming) =>
  FRAMED_RINGS.flatMap((ring) => ringOf(framing, ring))

const extentOf = (points: readonly { x: number; y: number }[]) => ({
  bottom: Math.max(...points.map(({ y }) => y)),
  left: Math.min(...points.map(({ x }) => x)),
  right: Math.max(...points.map(({ x }) => x)),
  top: Math.min(...points.map(({ y }) => y))
})

const CANVASES = [
  ['a portrait row', PORTRAIT_ROW],
  ['the 4K display row', TALL_ROW],
  ['a landscape canvas', LANDSCAPE],
  ['a wide strip', WIDE_STRIP]
] as const

describe('projectOnCanvas', () => {
  it.each(CANVASES)(
    'lands every point exactly where Three renders it, on %s',
    (_, canvas) => {
      const framing = frameTheTable(canvas)
      const camera = new PerspectiveCamera(45, 1, 0.1, 30)
      aimArenaCamera(camera, framing)
      for (const [x, y, z] of [
        [0, CAMERA_TARGET_HEIGHT, 0],
        [0.7, 0.3, -0.9],
        [-1.2, 0, 1.2],
        [1.07, DITCH_FLOOR, 0.2]
      ] as const) {
        const ndc = new Vector3(x, y, z).project(camera)
        const projected = projectOnCanvas(framing, { x, z }, y)
        expect(projected.x).toBeCloseTo(((ndc.x + 1) / 2) * canvas.width, 6)
        expect(projected.y).toBeCloseTo(((1 - ndc.y) / 2) * canvas.height, 6)
      }
    }
  )

  it('draws the drum nearer the room lower and larger, and a raised point higher', () => {
    const framing = frameTheTable(PORTRAIT_ROW)
    const near = projectOnCanvas(framing, { x: 0.5, z: 1 }, DRUM_LIP_TOP)
    const far = projectOnCanvas(framing, { x: 0.5, z: -1 }, DRUM_LIP_TOP)
    const raised = projectOnCanvas(framing, { x: 0.5, z: -1 }, 0.5)
    expect(near.y).toBeGreaterThan(far.y)
    expect(near.x).toBeGreaterThan(far.x)
    expect(raised.y).toBeLessThan(far.y)
  })
})

describe('frameTheTable', () => {
  it('frames the drum foot and lip, a standing top and a fallen one', () => {
    const radii = FRAMED_RINGS.map(({ radius }) => radius)
    expect(Math.max(...radii)).toBe(ARENA_DRUM.baseRadius)
    expect(FRAMED_RINGS).toContainEqual({
      radius: ARENA_DRUM.lipOuterRadius,
      y: DRUM_LIP_TOP
    })
    expect(Math.max(...FRAMED_RINGS.map(({ y }) => y))).toBeGreaterThan(
      ARENA_DRUM.surfaceHeight
    )
  })

  it.each(CANVASES)('keeps the whole drum inside %s', (_, canvas) => {
    const drum = extentOf(drumOutlineOf(frameTheTable(canvas)))
    expect(drum.left).toBeGreaterThan(0)
    expect(drum.right).toBeLessThan(canvas.width)
    expect(drum.top).toBeGreaterThan(0)
    expect(drum.bottom).toBeLessThan(canvas.height)
  })

  it.each(CANVASES)(
    'fills the binding axis of %s to the frame fill',
    (_, canvas) => {
      const drum = extentOf(drumOutlineOf(frameTheTable(canvas)))
      const acrossShare = (drum.right - drum.left) / canvas.width
      const downShare = (drum.bottom - drum.top) / canvas.height
      expect(Math.max(acrossShare, downShare)).toBeCloseTo(FRAME_FILL, 2)
    }
  )

  it.each(CANVASES)('centres the drum on the height of %s', (_, canvas) => {
    const drum = extentOf(drumOutlineOf(frameTheTable(canvas)))
    expect(drum.top).toBeCloseTo(canvas.height - drum.bottom, 1)
    expect(drum.left).toBeCloseTo(canvas.width - drum.right, 1)
  })

  it('keeps the drum the same size and seen from the same place in a shorter row', () => {
    const tall = frameTheTable(PORTRAIT_ROW)
    const short = frameTheTable({ ...PORTRAIT_ROW, height: 380 })
    expect(short.distance).toBeCloseTo(tall.distance)
    expect(short.halfHorizontal).toBeCloseTo(tall.halfHorizontal)
  })

  it('binds on the width in the display row, the drum being wider than tall', () => {
    const drum = extentOf(drumOutlineOf(frameTheTable(TALL_ROW)))
    expect((drum.right - drum.left) / TALL_ROW.width).toBeCloseTo(FRAME_FILL, 2)
    expect((drum.bottom - drum.top) / TALL_ROW.height).toBeLessThan(FRAME_FILL)
  })

  it('places the drum at the lens’s vertical centre', () => {
    const lens = { ...SHIPPED_LENS, verticalCentre: 0.35 }
    const drum = extentOf(drumOutlineOf(frameTheTable(TALL_ROW, lens)))
    expect((drum.top + drum.bottom) / 2 / TALL_ROW.height).toBeCloseTo(0.35, 2)
  })

  it('fills the binding axis to the lens’s fill', () => {
    const lens = { ...SHIPPED_LENS, frameFill: 0.6 }
    const drum = extentOf(drumOutlineOf(frameTheTable(TALL_ROW, lens)))
    expect((drum.right - drum.left) / TALL_ROW.width).toBeCloseTo(0.6, 2)
  })

  it('frames a taller drum and taller tops whole, at the same fill', () => {
    const shape = { drumHeightScale: 3, topHeightScale: 2 }
    const framing = frameTheTable(TALL_ROW, SHIPPED_LENS, shape)
    const drum = extentOf(
      framedRingsOf(shape).flatMap((ring) => ringOf(framing, ring))
    )
    const acrossShare = (drum.right - drum.left) / TALL_ROW.width
    const downShare = (drum.bottom - drum.top) / TALL_ROW.height
    expect(Math.max(acrossShare, downShare)).toBeCloseTo(FRAME_FILL, 2)
    expect(drum.top).toBeGreaterThan(0)
  })
})
