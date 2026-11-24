import type { Object3D } from 'three'

/** Lays a flat mesh (a circle, a ring, a plane) on the scene's horizontal, `height` above the alcove's floor. */
export const laidFlat = <TObject extends Object3D>(
  object: TObject,
  height: number
): TObject => {
  object.rotation.x = -Math.PI / 2
  object.position.y = height
  return object
}
