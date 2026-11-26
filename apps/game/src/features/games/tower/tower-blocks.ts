import type { TowerBlock } from '@parallax/protocol/tower'

export const TOWER_BLOCKS = [
  'plank',
  'cube',
  'cylinder',
  'arch',
  'trapezoid',
  'ell'
] as const satisfies readonly TowerBlock[]

/** How often each block is drawn: planks and cubes build, the others test. */
const DRAW_WEIGHTS: Record<TowerBlock, number> = {
  arch: 0.14,
  cube: 0.22,
  cylinder: 0.14,
  ell: 0.1,
  plank: 0.3,
  trapezoid: 0.1
}

/** A block's size before its yaw: `w` across, `h` up, `d` in depth. */
export type BlockSize = {
  readonly d: number
  readonly h: number
  readonly w: number
}

/** A block's size for a size unit `u`. */
export const blockSize = (kind: TowerBlock, u: number): BlockSize => {
  switch (kind) {
    case 'plank':
      return { d: u, h: 0.6 * u, w: 3 * u }
    case 'cube':
      return { d: u, h: u, w: u }
    case 'cylinder':
      return { d: u, h: 1.2 * u, w: u }
    case 'arch':
    case 'ell':
      return { d: u, h: u, w: 2 * u }
    case 'trapezoid':
      return { d: u, h: 0.8 * u, w: 2 * u }
    default:
      return kind satisfies never
  }
}

/** The arch's legs and lintel, as fractions of its unit. */
export const ARCH_LEG = 0.5
export const ARCH_LINTEL = 0.3

/** The trapezoid's top, as a fraction of its base. */
export const TRAPEZOID_TOP = 0.5

/** The ell: its foot's height and its post's width, as fractions of its unit. */
export const ELL_FOOT = 0.5
export const ELL_POST = 0.8

/**
 * The outline of a block extruded in depth, around its centre, counter-clockwise
 * from its bottom left; `null` for the cylinder, the only round one.
 */
export const blockProfile = (
  kind: TowerBlock,
  u: number
): readonly { readonly x: number; readonly y: number }[] | null => {
  const { h, w } = blockSize(kind, u)
  const [left, right, bottom, top] = [-w / 2, w / 2, -h / 2, h / 2]
  switch (kind) {
    case 'cylinder':
      return null
    case 'trapezoid': {
      const half = (w * TRAPEZOID_TOP) / 2
      return [
        { x: left, y: bottom },
        { x: right, y: bottom },
        { x: half, y: top },
        { x: -half, y: top }
      ]
    }
    case 'ell': {
      const foot = bottom + ELL_FOOT * u
      return [
        { x: left, y: bottom },
        { x: right, y: bottom },
        { x: right, y: foot },
        { x: left + ELL_POST * u, y: foot },
        { x: left + ELL_POST * u, y: top },
        { x: left, y: top }
      ]
    }
    default:
      return [
        { x: left, y: bottom },
        { x: right, y: bottom },
        { x: right, y: top },
        { x: left, y: top }
      ]
  }
}

/** How far a block reaches below and above its centre, and its half-size across and in depth once turned by `yaw`. */
export type BlockExtent = {
  readonly above: number
  readonly below: number
  readonly hx: number
  readonly hz: number
}

/** A block's extent standing upright, turned by `yaw` on itself: the box around it across and in depth. */
export const blockExtent = (
  kind: TowerBlock,
  u: number,
  yaw: number
): BlockExtent => {
  const { d, h, w } = blockSize(kind, u)
  const cos = Math.abs(Math.cos(yaw))
  const sin = Math.abs(Math.sin(yaw))
  return {
    above: h / 2,
    below: h / 2,
    hx: (cos * w + sin * d) / 2,
    hz: (sin * w + cos * d) / 2
  }
}

export type Point = {
  readonly x: number
  readonly y: number
  readonly z: number
}

/**
 * Points on a block's hull around its centre, before its pose: its corners,
 * and a ring of points for the cylinder. Turned by the pose, their lowest and
 * highest give how far the block reaches up and down wherever it lies.
 */
export const blockHull = (kind: TowerBlock, u: number): readonly Point[] => {
  const { d, h, w } = blockSize(kind, u)
  const profile = blockProfile(kind, u)
  if (profile === null) {
    return Array.from({ length: 16 }, (_, index) => {
      const angle = (index / 8) * Math.PI
      const y = index % 2 === 0 ? -h / 2 : h / 2
      return { x: (Math.cos(angle) * w) / 2, y, z: (Math.sin(angle) * w) / 2 }
    })
  }
  return profile.flatMap(({ x, y }) => [
    { x, y, z: -d / 2 },
    { x, y, z: d / 2 }
  ])
}

const drawOne = (random: () => number, without?: TowerBlock): TowerBlock => {
  const kinds = TOWER_BLOCKS.filter((kind) => kind !== without)
  const total = kinds.reduce((sum, kind) => sum + DRAW_WEIGHTS[kind], 0)
  let left = random() * total
  for (const kind of kinds) {
    left -= DRAW_WEIGHTS[kind]
    if (left <= 0) {
      return kind
    }
  }
  return kinds.at(-1) ?? 'cube'
}

/** Draws the two blocks a player picks from: never the same twice. */
export const drawOffer = (
  random: () => number
): readonly [TowerBlock, TowerBlock] => {
  const first = drawOne(random)
  return [first, drawOne(random, first)]
}
