import type { PerspectiveCamera } from 'three'

import { type ArenaFraming, cameraPositionOf } from './arena-camera'

/**
 * Points Three's camera the way `frameTheTable` framed it, orbited `azimuth`
 * radians around the drum, so the scene renders exactly what
 * `projectOnCanvas` computes from the room's side.
 */
export const aimArenaCamera = (
  camera: PerspectiveCamera,
  framing: ArenaFraming,
  azimuth = 0
): void => {
  const { halfVertical, height, targetHeight, viewOffsetY, width } = framing
  const { x, y, z } = cameraPositionOf(framing, azimuth)
  camera.fov = (halfVertical * 360) / Math.PI
  camera.aspect = width / height
  camera.up.set(0, 1, 0)
  camera.position.set(x, y, z)
  camera.lookAt(0, targetHeight, 0)
  camera.setViewOffset(width, height, 0, viewOffsetY, width, height)
  camera.updateMatrixWorld()
}
