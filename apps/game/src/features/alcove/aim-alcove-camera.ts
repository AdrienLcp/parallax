import type { PerspectiveCamera } from 'three'

import { alcoveFrustum, type CanvasSize } from './alcove-frustum'
import type { AlcoveGeometry } from './alcove-geometry'

const NEAR = 0.05
/** How far past the back wall the camera still draws, in alcove units. */
const BEYOND_BACK_WALL = 1

/** Puts the camera at the players' eye, looking square into the alcove, its view off-centre so the canvas is the display. */
export const aimAlcoveCamera = (
  camera: PerspectiveCamera,
  geometry: AlcoveGeometry,
  canvas: CanvasSize
): void => {
  const frustum = alcoveFrustum(geometry, canvas)
  camera.position.set(geometry.eye.x, geometry.eye.y, geometry.eye.z)
  camera.rotation.set(0, 0, 0)
  camera.fov = frustum.fieldOfViewDegrees
  camera.aspect = frustum.fullWidth / frustum.fullHeight
  camera.near = NEAR
  camera.far = geometry.eye.z + geometry.depth + BEYOND_BACK_WALL
  camera.setViewOffset(
    frustum.fullWidth,
    frustum.fullHeight,
    frustum.offsetX,
    frustum.offsetY,
    canvas.width,
    canvas.height
  )
  camera.updateMatrixWorld()
}
