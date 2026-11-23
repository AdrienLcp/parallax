/** A point or a direction on the arena floor, in arena units. */
export type PlanarVector = {
  readonly x: number
  readonly y: number
}

export const ORIGIN: PlanarVector = { x: 0, y: 0 }

export const added = (a: PlanarVector, b: PlanarVector): PlanarVector => ({
  x: a.x + b.x,
  y: a.y + b.y
})

export const subtracted = (a: PlanarVector, b: PlanarVector): PlanarVector => ({
  x: a.x - b.x,
  y: a.y - b.y
})

export const scaled = (vector: PlanarVector, factor: number): PlanarVector => ({
  x: vector.x * factor,
  y: vector.y * factor
})

export const dot = (a: PlanarVector, b: PlanarVector): number =>
  a.x * b.x + a.y * b.y

export const lengthOf = (vector: PlanarVector): number =>
  Math.hypot(vector.x, vector.y)

/** The same direction at length 1, or `ORIGIN` for a vector with no direction. */
export const normalized = (vector: PlanarVector): PlanarVector => {
  const length = lengthOf(vector)
  return length === 0 ? ORIGIN : scaled(vector, 1 / length)
}

/** The same direction, shortened to `maximum` when it is longer. */
export const clampedLength = (
  vector: PlanarVector,
  maximum: number
): PlanarVector => {
  const length = lengthOf(vector)
  return length <= maximum ? vector : scaled(vector, maximum / length)
}

/** `count` points spread evenly on a circle of `radius`, the first at the top. */
export const pointsOnCircle = ({
  count,
  radius
}: {
  count: number
  radius: number
}): PlanarVector[] =>
  Array.from({ length: count }, (_, index) => {
    const angle = -Math.PI / 2 + (index * 2 * Math.PI) / count
    return { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius }
  })
