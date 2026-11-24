import type { AlcoveGeometry } from './alcove-geometry'
import { DISPLAY_ASPECT } from './display-aspect'

/** A canvas's size, in CSS pixels. */
export type CanvasSize = { readonly height: number; readonly width: number }

/**
 * The off-centre view the eye has through the canvas: a symmetric view around
 * the point straight ahead of the eye, of which the canvas is one window.
 * Three's `fov`, `aspect` and `setViewOffset` take it as is.
 */
export type AlcoveFrustum = {
  /** The symmetric view's vertical field. */
  readonly fieldOfViewDegrees: number
  readonly fullHeight: number
  readonly fullWidth: number
  /** Where the canvas's top-left corner sits in the symmetric view, in CSS pixels. */
  readonly offsetX: number
  readonly offsetY: number
}

/**
 * The view that lays the display's 9:16 frame over the canvas, as large as it
 * fits and centred: the whole canvas on the unit, a centred band in a desktop
 * window.
 */
export const alcoveFrustum = (
  { eyeDistance, principalPoint }: AlcoveGeometry,
  { height, width }: CanvasSize
): AlcoveFrustum => {
  const screenHeight = Math.min(height, width / DISPLAY_ASPECT)
  const screenLeft = (width - screenHeight * DISPLAY_ASPECT) / 2
  const screenTop = (height - screenHeight) / 2
  const aheadX = screenLeft + principalPoint.x * DISPLAY_ASPECT * screenHeight
  const aheadY = screenTop + principalPoint.y * screenHeight
  const fullWidth = 2 * Math.max(aheadX, width - aheadX)
  const fullHeight = 2 * Math.max(aheadY, height - aheadY)
  return {
    fieldOfViewDegrees:
      (2 * Math.atan(fullHeight / 2 / (eyeDistance * screenHeight)) * 180) /
      Math.PI,
    fullHeight,
    fullWidth,
    offsetX: fullWidth / 2 - aheadX,
    offsetY: fullHeight / 2 - aheadY
  }
}
