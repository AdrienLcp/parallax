import type { AlcoveInterior } from '@/features/alcove/alcove-bounds'
import type {
  AlcoveGeometry,
  AlcovePoint
} from '@/features/alcove/alcove-geometry'
import { alcoveShelf } from '@/features/alcove/alcove-shelf'
import { projectInAlcove } from '@/features/alcove/project-in-alcove'

/** Where the globe floats and how big, in alcove units, with the loupe before it. */
export type GlobeStand = {
  readonly centre: AlcovePoint
  /** The players' eye seen from the globe's centre: where the crosshair sits on its surface. */
  readonly facing: AlcovePoint
  /** How far in front of the globe's surface the loupe floats, along `facing`. */
  readonly loupeGap: number
  readonly loupeRadius: number
  readonly radius: number
}

/** The globe's size: 0.56 of the alcove's width, as large as the room under the shelf allows. */
export const GLOBE_RADIUS = 0.28
const LOUPE = { gap: 0.1, radius: 0.15 } as const
/** How far under the shelf's front edge the globe's outline stays on the display, as a share of its height. */
const UNDER_SHELF = 0.012
/** The plank's thickness (`alcove-shelf.ts`): its front edge's underside is what the globe stays below. */
const PLANK_THICKNESS = 0.024
const PLANK_DEPTH = 0.075

/** The highest the sphere's outline reaches on the display, as a share from its top (smaller is higher). */
const outlineTop = (
  geometry: AlcoveGeometry,
  centre: AlcovePoint,
  radius: number
): number => {
  let top = Number.POSITIVE_INFINITY
  for (let step = 0; step <= 180; step += 1) {
    const angle = (step / 180) * Math.PI
    const { y } = projectInAlcove(geometry, {
      x: centre.x,
      y: centre.y + radius * Math.sin(angle),
      z: centre.z + radius * Math.cos(angle)
    })
    top = Math.min(top, y)
  }
  return top
}

/**
 * The globe in the alcove: midway in depth, centred across, and as high as
 * its outline can go while it stays under the room's shelf on the display,
 * so the seats' plaques show over it. Higher means further from the floor,
 * where its shadow lands.
 */
export const globeStand = (
  geometry: AlcoveGeometry,
  interior: AlcoveInterior
): GlobeStand => {
  const z = (interior.z.min + interior.z.max) / 2
  const shelf = alcoveShelf(geometry)
  const plankEdge = projectInAlcove(geometry, {
    x: 0,
    y: shelf.top - PLANK_THICKNESS,
    z: -geometry.depth + PLANK_DEPTH
  })
  const highest = plankEdge.y + UNDER_SHELF
  let low = GLOBE_RADIUS
  let high = geometry.height - GLOBE_RADIUS
  for (let step = 0; step < 40; step += 1) {
    const y = (low + high) / 2
    if (outlineTop(geometry, { x: 0, y, z }, GLOBE_RADIUS) < highest) high = y
    else low = y
  }
  const centre = { x: 0, y: low, z }
  const toEye = {
    x: geometry.eye.x - centre.x,
    y: geometry.eye.y - centre.y,
    z: geometry.eye.z - centre.z
  }
  const length = Math.hypot(toEye.x, toEye.y, toEye.z)
  return {
    centre,
    facing: { x: toEye.x / length, y: toEye.y / length, z: toEye.z / length },
    loupeGap: LOUPE.gap,
    loupeRadius: LOUPE.radius,
    radius: GLOBE_RADIUS
  }
}
