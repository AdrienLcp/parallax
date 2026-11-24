import type { AlcoveCalibration, ScreenShare } from './alcove-calibration'
import type { AlcoveGeometry } from './alcove-geometry'
import { DISPLAY_ASPECT } from './display-aspect'

/** A traced corner of one plane of the box: which side, whether at the roof, and where it was seen. */
type TracedCorner = {
  readonly across: -0.5 | 0.5
  readonly atRoof: boolean
  readonly seen: ScreenShare
}

/** One plane of the box, parallel to the screen, seen as `u = u0 + scale × x` and `v = v0 − scale × y` in screen heights. */
type PlaneFit = {
  /** The sum of the squared misses over its corners, in screen heights. */
  readonly miss: number
  readonly scale: number
  readonly u0: number
  readonly v0: number
}

const sumOf = <T>(items: readonly T[], term: (item: T) => number): number =>
  items.reduce((sum, item) => sum + term(item), 0)

/** The least-squares scale and shift that lay the box's plane, `height` tall, on its traced corners. */
const fitPlane = (
  corners: readonly TracedCorner[],
  height: number
): PlaneFit => {
  const points = corners.map(({ across, atRoof, seen }) => ({
    u: seen.x * DISPLAY_ASPECT,
    v: seen.y,
    x: across,
    y: atRoof ? height : 0
  }))
  const meanOf = (term: (point: (typeof points)[number]) => number) =>
    sumOf(points, term) / points.length
  const xMean = meanOf(({ x }) => x)
  const yMean = meanOf(({ y }) => y)
  const uMean = meanOf(({ u }) => u)
  const vMean = meanOf(({ v }) => v)
  const scale =
    sumOf(
      points,
      ({ u, v, x, y }) => (x - xMean) * (u - uMean) - (y - yMean) * (v - vMean)
    ) / sumOf(points, ({ x, y }) => (x - xMean) ** 2 + (y - yMean) ** 2)
  const u0 = uMean - scale * xMean
  const v0 = vMean + scale * yMean
  const miss = sumOf(
    points,
    ({ u, v, x, y }) => (u0 + scale * x - u) ** 2 + (v0 - scale * y - v) ** 2
  )
  return { miss, scale, u0, v0 }
}

const LOWEST_HEIGHT = 0.5
const HIGHEST_HEIGHT = 6
const SEARCH_STEPS = 80
const GOLDEN = (Math.sqrt(5) - 1) / 2

/** The height, in widths, that best fits both planes at once: their misses fall and rise once over the range. */
const bestHeight = (missAt: (height: number) => number): number => {
  let low = LOWEST_HEIGHT
  let high = HIGHEST_HEIGHT
  for (let step = 0; step < SEARCH_STEPS; step++) {
    const lower = high - GOLDEN * (high - low)
    const upper = low + GOLDEN * (high - low)
    if (missAt(lower) < missAt(upper)) high = upper
    else low = lower
  }
  return (low + high) / 2
}

/**
 * Solves the traced alcove as a box seen by one eye, the screen square to its
 * opening: the box's height and depth in widths, and where the eye stands.
 * The opening and the back wall are each a scaled copy of the other around
 * the point straight ahead of the eye; how much smaller the back wall looks,
 * with the eye's distance to the screen, sets how deep the box runs.
 */
export const solveAlcove = ({
  back,
  eyeDistance,
  front
}: AlcoveCalibration): AlcoveGeometry => {
  const frontCorners: readonly TracedCorner[] = [
    { across: -0.5, atRoof: false, seen: front.floorLeft },
    { across: 0.5, atRoof: false, seen: front.floorRight },
    { across: -0.5, atRoof: true, seen: front.roofLeft },
    { across: 0.5, atRoof: true, seen: front.roofRight }
  ]
  const backCorners: readonly TracedCorner[] = [
    { across: -0.5, atRoof: false, seen: back.bottomLeft },
    { across: 0.5, atRoof: false, seen: back.bottomRight },
    { across: -0.5, atRoof: true, seen: back.topLeft },
    { across: 0.5, atRoof: true, seen: back.topRight }
  ]
  const height = bestHeight(
    (candidate) =>
      fitPlane(frontCorners, candidate).miss +
      fitPlane(backCorners, candidate).miss
  )
  const opening = fitPlane(frontCorners, height)
  const backWall = fitPlane(backCorners, height)
  const shrink = opening.scale - backWall.scale
  const eyeX = (backWall.u0 - opening.u0) / shrink
  const eyeY = (opening.v0 - backWall.v0) / shrink
  const eyeZ = eyeDistance / opening.scale
  return {
    depth: eyeDistance / backWall.scale - eyeZ,
    eye: { x: eyeX, y: eyeY, z: eyeZ },
    eyeDistance,
    fitError: Math.sqrt(
      (opening.miss + backWall.miss) /
        (frontCorners.length + backCorners.length)
    ),
    height,
    principalPoint: {
      x: (opening.u0 + opening.scale * eyeX) / DISPLAY_ASPECT,
      y: opening.v0 - opening.scale * eyeY
    }
  }
}
