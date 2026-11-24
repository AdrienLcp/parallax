import { SUMO_TUNING } from './sumo-tuning'

/** The plan's radii, in arena units: the felt, its filets and its ticks, as the scene, its preview and the phone's stick all draw them. */
export const ARENA_PLAN = {
  centreRing: 0.503,
  centreSpot: 0.056,
  gutter: 1.14,
  gutterEdge: 1.135,
  rim: 0.991,
  tickRadius: 0.5,
  tickSize: 0.035,
  ticks: 8
} as const

/** Each brass filet's width across the table, in arena units. */
export const FILET_WIDTHS = {
  centreRing: 0.006,
  centreSpot: 0.012,
  gutterEdge: 0.01,
  rim: 0.018
} as const

export const FIELD_OF_VIEW_DEGREES = 28
/** How far the camera leans from straight above, toward the people standing in front. */
export const CAMERA_TILT_RADIANS = (14 * Math.PI) / 180
/** Room kept around the gutter so a falling top stays in frame. */
const FRAMING_MARGIN = 1.06

export const TOP_HEIGHT = SUMO_TUNING.topRadius * 1.2

/** A point on the table's plane, in arena units: `z` grows toward the room. */
export type TablePoint = { readonly x: number; readonly z: number }

/** A point on the canvas, in CSS pixels from its top-left corner. */
export type CanvasPoint = { readonly x: number; readonly y: number }

/** How the camera frames the table in one canvas: its distance and half angles of view. */
export type ArenaFraming = {
  readonly distance: number
  readonly halfHorizontal: number
  readonly halfVertical: number
  readonly height: number
  readonly width: number
}

/**
 * Backs the camera off until the gutter, and a top standing on it, fit the
 * canvas's tighter axis with the framing margin; the camera stands at that
 * distance, tilted toward the room, looking at the platform's centre.
 */
export const frameTheTable = ({
  height,
  width
}: {
  height: number
  width: number
}): ArenaFraming => {
  const halfVertical = (FIELD_OF_VIEW_DEGREES * Math.PI) / 360
  const halfHorizontal = Math.atan(Math.tan(halfVertical) * (width / height))
  const distance =
    ((ARENA_PLAN.gutter + TOP_HEIGHT) * FRAMING_MARGIN) /
    Math.tan(Math.min(halfVertical, halfHorizontal))
  return { distance, halfHorizontal, halfVertical, height, width }
}

/** Where the camera stands, in the scene's axes (y up, the table at y = 0). */
export const cameraPositionOf = ({ distance }: ArenaFraming) => ({
  x: 0,
  y: Math.cos(CAMERA_TILT_RADIANS) * distance,
  z: Math.sin(CAMERA_TILT_RADIANS) * distance
})

/**
 * Where a point of the scene lands on the canvas, seen through the scene's
 * camera: a point of the table, or `height` above it.
 */
export const projectOnCanvas = (
  framing: ArenaFraming,
  point: TablePoint,
  height = 0
): CanvasPoint => {
  const depth =
    framing.distance -
    Math.sin(CAMERA_TILT_RADIANS) * point.z -
    Math.cos(CAMERA_TILT_RADIANS) * height
  const down =
    Math.cos(CAMERA_TILT_RADIANS) * point.z -
    Math.sin(CAMERA_TILT_RADIANS) * height
  return {
    x:
      (framing.width / 2) *
      (1 + point.x / depth / Math.tan(framing.halfHorizontal)),
    y:
      (framing.height / 2) * (1 + down / depth / Math.tan(framing.halfVertical))
  }
}
