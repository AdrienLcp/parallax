import {
  ARENA_DRUM,
  DITCH_FLOOR,
  DITCH_REST_RADIUS,
  DRUM_LIP_TOP
} from './arena-drum'
import { SUMO_TUNING } from './sumo-tuning'

/**
 * The vertical field of view over the display's whole 9:16 portrait. The lens
 * keeps the matching horizontal field in any canvas, so the drum keeps its
 * size and perspective whatever height its row takes.
 */
export const FIELD_OF_VIEW_DEGREES = 48
const DISPLAY_ASPECT = 9 / 16
/** How far the camera looks down from level: a visitor standing in front of the drum. */
export const CAMERA_PITCH_RADIANS = (20 * Math.PI) / 180
/** Where the camera looks: the felt's centre. */
export const CAMERA_TARGET_HEIGHT = ARENA_DRUM.surfaceHeight
/** The share of the canvas's binding axis the drum spans, tops and fallen tops included. */
export const FRAME_FILL = 0.9

/** How much taller than the physics' disc the modelled top stands, so it reads from across the room. */
const TOP_SCALE = 2
export const TOP_HEIGHT = SUMO_TUNING.topRadius * 1.2 * TOP_SCALE

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
  /** How far the view slides down the canvas, in CSS pixels, to centre the drum: Three's view offset. */
  readonly viewOffsetY: number
  readonly width: number
}

type ExtentRing = { readonly radius: number; readonly y: number }

/** The outlines the frame holds: the drum's foot and lip, a top's crown standing at the rim, a fallen top lying along the ditch. */
export const FRAMED_RINGS: readonly ExtentRing[] = [
  { radius: ARENA_DRUM.baseRadius, y: 0 },
  { radius: ARENA_DRUM.lipOuterRadius, y: DRUM_LIP_TOP },
  {
    radius: SUMO_TUNING.arenaRadius + SUMO_TUNING.topRadius,
    y: ARENA_DRUM.surfaceHeight + TOP_HEIGHT
  },
  {
    radius: Math.hypot(DITCH_REST_RADIUS, TOP_HEIGHT),
    y: DITCH_FLOOR + 2 * SUMO_TUNING.topRadius
  }
]

const EXTENT_STEPS = 96

const EXTENT_POINTS = FRAMED_RINGS.flatMap(({ radius, y }) =>
  Array.from({ length: EXTENT_STEPS }, (_, step) => {
    const angle = (step * 2 * Math.PI) / EXTENT_STEPS
    return { x: Math.cos(angle) * radius, y, z: Math.sin(angle) * radius }
  })
)

type ScenePoint = { readonly x: number; readonly y: number; readonly z: number }

/** A scene point in the camera's axes: across to the right, up the screen, and its depth ahead. */
const seenFrom = (distance: number, { x, y, z }: ScenePoint) => {
  const raised = y - CAMERA_TARGET_HEIGHT
  const sin = Math.sin(CAMERA_PITCH_RADIANS)
  const cos = Math.cos(CAMERA_PITCH_RADIANS)
  return {
    across: x,
    depth: distance - raised * sin - z * cos,
    up: raised * cos - z * sin
  }
}

type Lens = { readonly tanHorizontal: number; readonly tanVertical: number }

/** The extent's reach on the unshifted view, in normalised device units (−1 to 1), or `null` once part of it is behind the camera. */
const extentAt = (distance: number, { tanHorizontal, tanVertical }: Lens) => {
  let across = 0
  let lowest = Number.POSITIVE_INFINITY
  let highest = Number.NEGATIVE_INFINITY
  for (const point of EXTENT_POINTS) {
    const seen = seenFrom(distance, point)
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
 * standing at the rim, a fallen one in the ditch) spans `FRAME_FILL` of the
 * canvas's binding axis, then slides the view so that extent sits centred
 * on the canvas's height. The camera looks at the felt's centre from the
 * room's side, `CAMERA_PITCH_RADIANS` above level.
 */
export const frameTheTable = ({
  height,
  width
}: {
  height: number
  width: number
}): ArenaFraming => {
  const halfHorizontal = Math.atan(
    Math.tan((FIELD_OF_VIEW_DEGREES * Math.PI) / 360) * DISPLAY_ASPECT
  )
  const halfVertical = Math.atan(Math.tan(halfHorizontal) / (width / height))
  const lens = {
    tanHorizontal: Math.tan(halfHorizontal),
    tanVertical: Math.tan(halfVertical)
  }
  const fits = (distance: number) => {
    const extent = extentAt(distance, lens)
    return (
      extent !== null &&
      extent.across <= FRAME_FILL &&
      (extent.highest - extent.lowest) / 2 <= FRAME_FILL
    )
  }
  let near = NEAREST_DISTANCE
  let far = FARTHEST_DISTANCE
  for (let step = 0; step < FRAMING_STEPS; step++) {
    const middle = (near + far) / 2
    if (fits(middle)) far = middle
    else near = middle
  }
  const extent = extentAt(far, lens)
  const middle = extent === null ? 0 : (extent.highest + extent.lowest) / 2
  return {
    distance: far,
    halfHorizontal,
    halfVertical,
    height,
    viewOffsetY: (-height / 2) * middle,
    width
  }
}

/** Where the camera stands, in the scene's axes (y up from the alcove's floor, z toward the room). */
export const cameraPositionOf = ({ distance }: ArenaFraming) => ({
  x: 0,
  y: CAMERA_TARGET_HEIGHT + Math.sin(CAMERA_PITCH_RADIANS) * distance,
  z: Math.cos(CAMERA_PITCH_RADIANS) * distance
})

/**
 * Where a point of the scene lands on the canvas, seen through the scene's
 * camera: a point of the table's plane `height` above the alcove's floor.
 */
export const projectOnCanvas = (
  framing: ArenaFraming,
  point: TablePoint,
  height = 0
): CanvasPoint => {
  const seen = seenFrom(framing.distance, { ...point, y: height })
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
