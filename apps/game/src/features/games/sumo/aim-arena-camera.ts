import type { PerspectiveCamera } from 'three'

import {
  type ArenaFraming,
  CAMERA_TARGET_HEIGHT,
  cameraPositionOf
} from './arena-camera'

/** Points Three's camera the way `frameTheTable` framed it, so the scene renders exactly what `projectOnCanvas` computes. */
export const aimArenaCamera = (
  camera: PerspectiveCamera,
  framing: ArenaFraming
): void => {
  const { halfVertical, height, viewOffsetY, width } = framing
  const { x, y, z } = cameraPositionOf(framing)
  camera.fov = (halfVertical * 360) / Math.PI
  camera.aspect = width / height
  camera.up.set(0, 1, 0)
  camera.position.set(x, y, z)
  camera.lookAt(0, CAMERA_TARGET_HEIGHT, 0)
  camera.setViewOffset(width, height, 0, viewOffsetY, width, height)
  camera.updateMatrixWorld()
}
