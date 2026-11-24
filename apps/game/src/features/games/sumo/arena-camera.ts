import { DISPLAY_ASPECT } from '@/features/alcove/display-aspect'

import { ARENA_DRUM, DITCH_REST_RADIUS } from './arena-drum'
import {
  type ArenaShape,
  heightsOf,
  SHIPPED_HEIGHTS,
  SHIPPED_SHAPE
} from './arena-shape'
import { SUMO_TUNING } from './sumo-tuning'

/** How the camera sees the drum: tuned on the unit, shipped at `SHIPPED_LENS`. */
export type ArenaLens = {
  /** The vertical field of view over the display's whole 9:16 portrait. */
  readonly fieldOfViewDegrees: number
  /** The share of the canvas's binding axis the drum spans, tops and fallen tops included. */
  readonly frameFill: number
  /** How far the camera looks down from level: a visitor standing in front of the drum. */
  readonly pitchDegrees: number
  /** Where the drum's extent is centred, as a share of the canvas's height from its top. */
  readonly verticalCentre: number
}

/**
 * The lens keeps the horizontal field matching its vertical one over the
 * display's 9:16 portrait in any canvas, so the drum keeps its size and
 * perspective whatever height its row takes.
 */
export const SHIPPED_LENS: ArenaLens = {
  fieldOfViewDegrees: 48,
  frameFill: 0.9,
  pitchDegrees: 20,
  verticalCentre: 0.5
}

/** Where the shipped camera looks: the felt's centre. */
export const CAMERA_TARGET_HEIGHT = SHIPPED_HEIGHTS.surfaceHeight
export const FRAME_FILL = SHIPPED_LENS.frameFill
export const TOP_HEIGHT = SHIPPED_HEIGHTS.topHeight

/** A point on the table's plane, in arena units: `z` grows toward the room. */
export type TablePoint = { readonly x: number; readonly z: number }

/** A point on the canvas, in CSS pixels from its top-left corner. */
export type CanvasPoint = { readonly x: number; readonly y: number }

/** How the camera frames the drum in one canvas. */
export type ArenaFraming = {
  /** From the camera to the felt's centre, in arena units. */
  readonly distance: number
  readonly halfHorizontal: number
  readonly halfVertical: number
  readonly height: number
  /** How far the camera looks down from level, in radians. */
  readonly pitch: number
  /** The height of the felt's centre, where the camera looks. */
  readonly targetHeight: number
  /** How far the view slides down the canvas, in CSS pixels, to place the drum: Three's view offset. */
  readonly viewOffsetY: number
  readonly width: number
}

type ExtentRing = { readonly radius: number; readonly y: number }

/** The outlines the frame holds: the drum's foot and lip, a top's crown standing at the rim, a fallen top lying along the ditch. */
export const framedRingsOf = (shape: ArenaShape): readonly ExtentRing[] => {
  const { ditchFloor, lipTop, surfaceHeight, topHeight } = heightsOf(shape)
  return [
    { radius: ARENA_DRUM.baseRadius, y: 0 },
    { radius: ARENA_DRUM.lipOuterRadius, y: lipTop },
    {
      radius: SUMO_TUNING.arenaRadius + SUMO_TUNING.topRadius,
      y: surfaceHeight + topHeight
    },
    {
      radius: Math.hypot(DITCH_REST_RADIUS, topHeight),
      y: ditchFloor + 2 * SUMO_TUNING.topRadius
    }
  ]
}

export const FRAMED_RINGS = framedRingsOf(SHIPPED_SHAPE)

const EXTENT_STEPS = 96

type ScenePoint = { readonly x: number; readonly y: number; readonly z: number }

const extentPointsOf = (shape: ArenaShape): readonly ScenePoint[] =>
  framedRingsOf(shape).flatMap(({ radius, y }) =>
    Array.from({ length: EXTENT_STEPS }, (_, step) => {
      const angle = (step * 2 * Math.PI) / EXTENT_STEPS
      return { x: Math.cos(angle) * radius, y, z: Math.sin(angle) * radius }
    })
  )

type Viewpoint = {
  readonly distance: number
  readonly pitch: number
  readonly targetHeight: number
}

/** A scene point in the camera's axes, seen from the room's side: across to the right, up the screen, and its depth ahead. */
const seenFrom = (
  { distance, pitch, targetHeight }: Viewpoint,
  { x, y, z }: ScenePoint
) => {
  const raised = y - targetHeight
  const sin = Math.sin(pitch)
  const cos = Math.cos(pitch)
  return {
    across: x,
    depth: distance - raised * sin - z * cos,
    up: raised * cos - z * sin
  }
}

type Lens = { readonly tanHorizontal: number; readonly tanVertical: number }

/** The extent's reach on the unshifted view, in normalised device units (−1 to 1), or `null` once part of it is behind the camera. */
const extentAt = (
  viewpoint: Viewpoint,
  points: readonly ScenePoint[],
  { tanHorizontal, tanVertical }: Lens
) => {
  let across = 0
  let lowest = Number.POSITIVE_INFINITY
  let highest = Number.NEGATIVE_INFINITY
  for (const point of points) {
    const seen = seenFrom(viewpoint, point)
    if (seen.depth <= 0) return null
    across = Math.max(
      across,
      Math.abs(seen.across / seen.depth / tanHorizontal)
    )
    const up = seen.up / seen.depth / tanVertical
    lowest = Math.min(lowest, up)
    highest = Math.max(highest, up)
  }
  return { across, highest, lowest }
}

const NEAREST_DISTANCE = 0.5
const FARTHEST_DISTANCE = 200
const FRAMING_STEPS = 48

/**
 * Backs the camera off until the drum's extent (its foot and lip, a top
 * standing at the rim, a fallen one in the ditch) spans the lens's fill of
 * the canvas's binding axis, then slides the view so that extent is centred
 * at the lens's vertical centre. The camera looks at the felt's centre from
 * the room's side, the lens's pitch above level. The drum is round, so the
 * framing holds whatever the camera's azimuth.
 */
export const frameTheTable = (
  { height, width }: { height: number; width: number },
  lens: ArenaLens = SHIPPED_LENS,
  shape: ArenaShape = SHIPPED_SHAPE
): ArenaFraming => {
  const halfHorizontal = Math.atan(
    Math.tan((lens.fieldOfViewDegrees * Math.PI) / 360) * DISPLAY_ASPECT
  )
  const halfVertical = Math.atan(Math.tan(halfHorizontal) / (width / height))
  const tans = {
    tanHorizontal: Math.tan(halfHorizontal),
    tanVertical: Math.tan(halfVertical)
  }
  const pitch = (lens.pitchDegrees * Math.PI) / 180
  const targetHeight = heightsOf(shape).surfaceHeight
  const points = extentPointsOf(shape)
  const extentFrom = (distance: number) =>
    extentAt({ distance, pitch, targetHeight }, points, tans)
  const fits = (distance: number) => {
    const extent = extentFrom(distance)
    return (
      extent !== null &&
      extent.across <= lens.frameFill &&
      (extent.highest - extent.lowest) / 2 <= lens.frameFill
    )
  }
  let near = NEAREST_DISTANCE
  let far = FARTHEST_DISTANCE
  for (let step = 0; step < FRAMING_STEPS; step++) {
    const middle = (near + far) / 2
    if (fits(middle)) far = middle
    else near = middle
  }
  const extent = extentFrom(far)
  const middle = extent === null ? 0 : (extent.highest + extent.lowest) / 2
  const wantedMiddle = 1 - 2 * lens.verticalCentre
  return {
    distance: far,
    halfHorizontal,
    halfVertical,
    height,
    pitch,
    targetHeight,
    viewOffsetY: (-height / 2) * (middle - wantedMiddle),
    width
  }
}

/**
 * Where the camera stands, in the scene's axes (y up from the alcove's floor,
 * z toward the room), once it has orbited `azimuth` radians around the drum's
 * axis from the room's side, toward the room's right.
 */
export const cameraPositionOf = (
  { distance, pitch, targetHeight }: ArenaFraming,
  azimuth = 0
) => {
  const level = Math.cos(pitch) * distance
  return {
    x: Math.sin(azimuth) * level,
    y: targetHeight + Math.sin(pitch) * distance,
    z: Math.cos(azimuth) * level
  }
}

/**
 * Where a point of the scene lands on the canvas, seen through the scene's
 * camera from the room's side: a point of the table's plane `height` above
 * the alcove's floor.
 */
export const projectOnCanvas = (
  framing: ArenaFraming,
  point: TablePoint,
  height = 0
): CanvasPoint => {
  const seen = seenFrom(framing, { ...point, y: height })
  return {
    x:
      (framing.width / 2) *
      (1 + seen.across / seen.depth / Math.tan(framing.halfHorizontal)),
    y:
      (framing.height / 2) *
        (1 - seen.up / seen.depth / Math.tan(framing.halfVertical)) -
      framing.viewOffsetY
  }
}
