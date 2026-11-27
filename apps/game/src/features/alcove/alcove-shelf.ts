import {
  BoxGeometry,
  type Color,
  Group,
  Mesh,
  MeshStandardMaterial
} from 'three'

import type { AlcoveGeometry } from './alcove-geometry'

/**
 * The room's shelf on the back wall, in alcove units: the seats' plaques stand
 * on it. A plank, level like every surface that holds things, under the
 * middle of the wall's height, with two brackets under it.
 */
const SHELF = {
  bracketHeight: 0.06,
  bracketWidth: 0.012,
  /** Each bracket's distance from the wall's centre. */
  bracketX: 0.36,
  depth: 0.075,
  /** The plank's centre, as a share of the alcove's height. */
  rise: 0.578,
  thickness: 0.024,
  width: 0.92
} as const

/** Where the shelf stands, for what is laid on it. */
export type AlcoveShelf = {
  /** The plank's underside. */
  readonly bottom: number
  /** The plank's centre, front to back. */
  readonly middleZ: number
  /** The plank's top face, what stands on it rests at this height. */
  readonly top: number
  /** From the wall's centre to each end of the plank. */
  readonly halfWidth: number
}

/** The shelf in this alcove: its top face and its middle, for the plaques the room stands on it. */
export const alcoveShelf = ({
  depth,
  height
}: AlcoveGeometry): AlcoveShelf => ({
  bottom: height * SHELF.rise - SHELF.thickness / 2,
  halfWidth: SHELF.width / 2,
  middleZ: -depth + SHELF.depth / 2,
  top: height * SHELF.rise + SHELF.thickness / 2
})

/** What a game's renderer is asked, beyond its own scene. */
export type ShelfOption = {
  /** The room's scene, not the game choice's showcase: the room stands its seats' plaques on the shelf. */
  readonly hasShelf?: boolean
}

/** The shelf's colours, from the game's world: its wood and its brackets' metal. */
export type AlcoveShelfColors = {
  readonly metal: Color
  readonly wood: Color
}

/**
 * The shelf as a mesh, which a game adds to its scene so it takes that game's
 * light. It casts no shadow: the tower's and the claw's overhead lights would
 * run the plank's down the whole wall to the floor. The room's shell paints a
 * short soft one under it, and stands the seats' plaques on it
 * (`alcoveShelf`), both behind the game's canvas.
 */
export const buildAlcoveShelf = (
  geometry: AlcoveGeometry,
  { metal, wood }: AlcoveShelfColors
): Group => {
  const { middleZ, top } = alcoveShelf(geometry)
  const plank = new Mesh(
    new BoxGeometry(SHELF.width, SHELF.thickness, SHELF.depth),
    new MeshStandardMaterial({ color: wood, roughness: 0.6 })
  )
  plank.position.set(0, top - SHELF.thickness / 2, middleZ)
  plank.receiveShadow = true

  const shelf = new Group()
  shelf.add(plank)
  const brass = new MeshStandardMaterial({
    color: metal,
    metalness: 0.85,
    roughness: 0.3
  })
  for (const x of [-SHELF.bracketX, SHELF.bracketX]) {
    const bracket = new Mesh(
      new BoxGeometry(
        SHELF.bracketWidth,
        SHELF.bracketHeight,
        SHELF.depth * 0.8
      ),
      brass
    )
    bracket.position.set(
      x,
      top - SHELF.thickness - SHELF.bracketHeight / 2 + 0.004,
      -geometry.depth + SHELF.depth * 0.4
    )
    shelf.add(bracket)
  }
  return shelf
}
