import type { AlcoveGeometry } from './alcove-geometry'
import { projectInAlcove } from './project-in-alcove'

type Span = { readonly max: number; readonly min: number }

/** The room inside the box, in alcove units. */
export type AlcoveVolume = {
  readonly x: Span
  readonly y: Span
  readonly z: Span
}

/** A rectangle of the display, as shares of its width and height. */
export type ScreenRect = {
  readonly bottom: number
  readonly left: number
  readonly right: number
  readonly top: number
}

/** Where an object's centre may go and stay `clearance` off the walls, the roof, the back wall and the opening. */
export const alcoveVolume = (
  { depth, height }: AlcoveGeometry,
  clearance = 0
): AlcoveVolume => ({
  x: { max: 0.5 - clearance, min: clearance - 0.5 },
  y: { max: height - clearance, min: 0 },
  z: { max: -clearance, min: clearance - depth }
})

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
