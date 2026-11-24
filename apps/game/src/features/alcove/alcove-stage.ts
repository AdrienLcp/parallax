import { type Color, Group, Mesh, PlaneGeometry, ShadowMaterial } from 'three'

import type { AlcoveGeometry } from './alcove-geometry'

/** How dark the shadows the alcove catches fall, on its floor and on its back wall. */
export type AlcoveShadows = {
  readonly color: Color
  readonly floorOpacity: number
  readonly wallOpacity: number
}

const shadowCatcher = (
  { color }: AlcoveShadows,
  { height, opacity, width }: { height: number; opacity: number; width: number }
): Mesh => {
  const catcher = new Mesh(
    new PlaneGeometry(width, height),
    new ShadowMaterial({ color, depthWrite: false, opacity })
  )
  catcher.receiveShadow = true
  return catcher
}

/**
 * The alcove's floor and back wall, never drawn, only shadowed: the optics
 * show the real ones, and the scene's shadows land on them. Objects cast
 * shadows; the stage receives them.
 */
export const buildAlcoveStage = (
  { depth, height }: AlcoveGeometry,
  shadows: AlcoveShadows
): Group => {
  const floor = shadowCatcher(shadows, {
    height: depth,
    opacity: shadows.floorOpacity,
    width: 1
  })
  floor.rotation.x = -Math.PI / 2
  floor.position.z = -depth / 2

  const backWall = shadowCatcher(shadows, {
    height,
    opacity: shadows.wallOpacity,
    width: 1
  })
  backWall.position.set(0, height / 2, -depth)

  const stage = new Group()
  stage.add(floor, backWall)
  return stage
}
