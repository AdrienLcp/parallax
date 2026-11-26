import type { AlcoveInterior } from '@/features/alcove/alcove-bounds'
import type { AlcoveGeometry } from '@/features/alcove/alcove-geometry'

/** A plush's body radius, in alcove units. */
export const PLUSH_RADIUS = 0.064

/** A plush's widest half (the duck): the outermost ones meet the interior without crossing it. */
const PLUSH_REACH = PLUSH_RADIUS * 1.05

/** How far an open claw's prongs reach from its axis: a claw stops that far from a wall. */
export const CLAW_REACH = 0.1

/** The rails' square section. */
export const RAIL_SIZE = 0.036

/** The pile's highest point, at the back, in alcove units. */
const PILE_PEAK = 0.27

export const CHUTE_WALL = 0.012

/** A chute's open box: its outer faces on the interior's side wall and floor front. */
export const CHUTE_SIZE = { depth: 0.13, height: 0.11, width: 0.16 } as const

/** A prize resting on a surface has its centre this high above it. */
export const REST_LIFT = PLUSH_RADIUS * 0.85

/** From a gripped prize's centre up to the claw's hub. */
export const CARRY_DROP = 0.2

type Area = {
  readonly maxX: number
  readonly maxZ: number
  readonly minX: number
  readonly minZ: number
}

export type Chute = { readonly x: number; readonly z: number }

/**
 * Where everything stands in the claw's alcove: the pile from wall to wall on
 * the floor, a chute in each front corner, the rails flat against the real
 * roof, and the box each claw's axis stays in so its prongs never cross a wall.
 */
export type ClawPit = {
  readonly chutes: readonly [Chute, Chute]
  /** Whether a point of the floor lies in a chute's footprint. */
  readonly inChute: (x: number, z: number) => boolean
  /** Whether a prize may rest centred on this point of the pile. */
  readonly inPile: (x: number, z: number) => boolean
  /** Where a prize's centre may lie in the pile. */
  readonly pile: Area
  /** Where a claw's axis may go. */
  readonly reach: Area
  /** The rails' outer faces across, their front and back ends. */
  readonly rail: {
    readonly back: number
    readonly front: number
    readonly halfX: number
    readonly y: number
  }
  /** The height a claw roams at, between the pile and the rails. */
  readonly roamY: number
  /** Where a prize dropped in a chute is out of sight. */
  readonly sunkY: number
  /** The floor's height under a point: the pile's mound, or a chute's rim. */
  readonly surfaceY: (x: number, z: number) => number
}

/** The claw's alcove laid out in `interior`, its rails against `geometry`'s real roof. */
export const clawPit = (
  geometry: AlcoveGeometry,
  interior: AlcoveInterior
): ClawPit => {
  const halfX = interior.x.max - PLUSH_REACH
  const backZ = interior.z.min + PLUSH_REACH
  const frontZ = interior.floorFront - PLUSH_REACH
  const chuteZ = interior.floorFront - (CHUTE_SIZE.depth + CHUTE_WALL) / 2
  const chuteX = interior.x.max - CHUTE_SIZE.width / 2 - CHUTE_WALL / 2
  const chutes: [Chute, Chute] = [
    { x: -chuteX, z: chuteZ },
    { x: chuteX, z: chuteZ }
  ]

  const mound = (x: number, z: number): number => {
    const rise = Math.min(
      1,
      Math.max(0, (frontZ - z) / (frontZ - backZ - 0.08))
    )
    const shoulder = 1 - 0.55 * (x / (halfX + 0.04)) ** 2
    return PILE_PEAK * rise ** 1.2 * shoulder
  }

  const inChute = (x: number, z: number): boolean =>
    chutes.some(
      (chute) =>
        Math.abs(x - chute.x) <= CHUTE_SIZE.width / 2 + CHUTE_WALL &&
        Math.abs(z - chute.z) <= CHUTE_SIZE.depth / 2 + CHUTE_WALL
    )

  const reachX = interior.x.max - CLAW_REACH
  return {
    chutes,
    inChute,
    inPile: (x, z) =>
      Math.abs(x) < halfX &&
      z > backZ &&
      z < frontZ &&
      !(
        Math.abs(x) > halfX - CHUTE_SIZE.width - 0.03 &&
        z > chuteZ - CHUTE_SIZE.depth / 2 - PLUSH_RADIUS * 1.2
      ),
    pile: { maxX: halfX, maxZ: frontZ, minX: -halfX, minZ: backZ },
    rail: {
      back: interior.z.min,
      front: interior.z.max,
      halfX: interior.x.max,
      y: geometry.height - RAIL_SIZE / 2
    },
    reach: {
      maxX: reachX,
      maxZ: interior.floorFront - CLAW_REACH,
      minX: -reachX,
      minZ: interior.z.min + CLAW_REACH
    },
    roamY: geometry.height * 0.42,
    sunkY: CHUTE_SIZE.height * 0.2,
    surfaceY: (x, z) => (inChute(x, z) ? CHUTE_SIZE.height : mound(x, z))
  }
}
