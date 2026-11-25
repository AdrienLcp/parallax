import type { AlcoveGeometry } from './alcove-geometry'
import { projectInAlcove } from './project-in-alcove'

type Span = { readonly max: number; readonly min: number }

/** The room inside the box, in alcove units. */
export type AlcoveVolume = {
  readonly x: Span
  readonly y: Span
  readonly z: Span
}

/** The room a game stands its scene in: every object's surface, not only its centre, stays inside it. */
export type AlcoveInterior = AlcoveVolume & {
  /** How far forward what stands on the floor may come: the opening's floor edge is seen almost edge-on, so it needs more depth than `z.max`. */
  readonly floorFront: number
}

/** A rectangle of the display, as shares of its width and height. */
export type ScreenRect = {
  readonly bottom: number
  readonly left: number
  readonly right: number
  readonly top: number
}

/**
 * The gap every edge of the alcove keeps on the display, as a share of its
 * height: 25 px of 1920, picked by eye on the unit on 2026-11-25. It covers
 * the calibration's 0.5–1 % spread and a player standing off the measured
 * eye, so nothing ever spills past a wall, the roof or the opening.
 */
export const ALCOVE_MARGIN = 25 / 1920

/**
 * The alcove pulled in so that every edge shows `margin` on the display; the
 * floor keeps none, since things rest on it. A step `d` across the view at
 * distance `D` from the eye moves `d * eyeDistance / D` screen heights, so the
 * walls and the roof take theirs at the back wall, where it shows smallest.
 * The back wall faces the eye: stepping off it moves nothing on screen, it
 * only keeps objects out of its surface. The opening's floor edge is seen
 * edge-on: stepping back by `d` raises a floor point by
 * `eye.y * eyeDistance * (1 / eye.z - 1 / (eye.z + d))`, solved for `floorFront`.
 */
export const alcoveInterior = (
  { depth, eye, eyeDistance, height }: AlcoveGeometry,
  margin = ALCOVE_MARGIN
): AlcoveInterior => {
  const across = (margin * (eye.z + depth)) / eyeDistance
  const floorStepBack = 1 / (1 / eye.z - margin / (eyeDistance * eye.y)) - eye.z
  return {
    floorFront: -floorStepBack,
    x: { max: 0.5 - across, min: across - 0.5 },
    y: { max: height - across, min: 0 },
    z: { max: -across, min: across - depth }
  }
}

/** Where the box's cross-section `z` deep shows on the display: what text laid in that plane must stay inside. */
export const screenRectAt = (
  geometry: AlcoveGeometry,
  z: number
): ScreenRect => {
  const topLeft = projectInAlcove(geometry, { x: -0.5, y: geometry.height, z })
  const bottomRight = projectInAlcove(geometry, { x: 0.5, y: 0, z })
  return {
    bottom: bottomRight.y,
    left: topLeft.x,
    right: bottomRight.x,
    top: topLeft.y
  }
}
