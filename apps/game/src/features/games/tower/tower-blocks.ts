import type { TowerBlock } from '@parallax/protocol/tower'

export const TOWER_BLOCKS = [
  'plank',
  'cube',
  'cylinder',
  'arch',
  'triangle'
] as const satisfies readonly TowerBlock[]

/** How often each block is drawn: planks and cubes build, arches and triangles test. */
const DRAW_WEIGHTS: Record<TowerBlock, number> = {
  arch: 0.18,
  cube: 0.24,
  cylinder: 0.16,
  plank: 0.32,
  triangle: 0.1
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
    case 'triangle':
      return { d: u, h: u, w: 2 * u }
    default:
      return kind satisfies never
  }
}

/** The arch's legs and lintel, as fractions of its unit. */
export const ARCH_LEG = 0.5
export const ARCH_LINTEL = 0.3

/**
 * The triangle's base and apex around its centroid, so the body's centre of
 * mass is the shape's.
 */
export const triangleSpan = (h: number) => ({ apex: (2 * h) / 3, base: -h / 3 })

/** How far a block reaches below and above its centre, and its half-size across and in depth once turned by `yaw`. */
export type BlockExtent = {
  readonly above: number
  readonly below: number
  readonly hx: number
  readonly hz: number
}

/** A block's extent, its yaw a quarter turn or none (a few degrees off either). */
export const blockExtent = (
  kind: TowerBlock,
  u: number,
  yaw: number
): BlockExtent => {
  const { d, h, w } = blockSize(kind, u)
  const isQuarter = Math.abs(Math.sin(yaw)) > 0.5
  const { apex, base } =
    kind === 'triangle' ? triangleSpan(h) : { apex: h / 2, base: -h / 2 }
  return {
    above: apex,
    below: -base,
    hx: (isQuarter ? d : w) / 2,
    hz: (isQuarter ? w : d) / 2
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
  if (kind === 'cylinder') {
    return Array.from({ length: 16 }, (_, index) => {
      const angle = (index / 8) * Math.PI
      const y = index % 2 === 0 ? -h / 2 : h / 2
      return { x: (Math.cos(angle) * w) / 2, y, z: (Math.sin(angle) * w) / 2 }
    })
  }
  const { apex, base } =
    kind === 'triangle' ? triangleSpan(h) : { apex: h / 2, base: -h / 2 }
  const tops =
    kind === 'triangle'
      ? [{ x: 0, y: apex }]
      : [
          { x: -w / 2, y: apex },
          { x: w / 2, y: apex }
        ]
  return [{ x: -w / 2, y: base }, { x: w / 2, y: base }, ...tops].flatMap(
    ({ x, y }) => [
      { x, y, z: -d / 2 },
      { x, y, z: d / 2 }
    ]
  )
}

/** Draws the next block. */
export const drawBlock = (random: () => number): TowerBlock => {
  let left = random()
  for (const kind of TOWER_BLOCKS) {
    left -= DRAW_WEIGHTS[kind]
    if (left <= 0) {
      return kind
    }
  }
  return 'cube'
}

/** Draws how a block is turned: a long block lies across or in depth, a round or square one a few degrees off. */
export const drawYaw = (kind: TowerBlock, random: () => number): number =>
  kind === 'cube' || kind === 'cylinder'
    ? (random() - 0.5) * 0.3
    : random() < 0.35
      ? Math.PI / 2
      : 0
