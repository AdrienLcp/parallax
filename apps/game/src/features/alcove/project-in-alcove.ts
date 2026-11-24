import type { ScreenShare } from './alcove-calibration'
import type { AlcoveGeometry, AlcovePoint } from './alcove-geometry'
import { DISPLAY_ASPECT } from './display-aspect'

/** Where a point of the scene lands on the display, seen from the players' eye. */
export const projectInAlcove = (
  { eye, eyeDistance, principalPoint }: AlcoveGeometry,
  { x, y, z }: AlcovePoint
): ScreenShare => {
  const scale = eyeDistance / (eye.z - z)
  return {
    x: principalPoint.x + (scale * (x - eye.x)) / DISPLAY_ASPECT,
    y: principalPoint.y - scale * (y - eye.y)
  }
}
