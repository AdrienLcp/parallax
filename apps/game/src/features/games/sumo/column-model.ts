import {
  type Color,
  LatheGeometry,
  Mesh,
  MeshStandardMaterial,
  Vector2
} from 'three'

/** The shortest column the profile draws without its foot and capital overlapping, in arena units. */
const SHORTEST_RISE = 0.32
const ROUND_SEGMENTS = 96

/**
 * The guéridon column's outline, in arena units from its axis and the floor:
 * a round stepped foot, a turned neck, a slim shaft, a collar and a capital
 * under the table. `rise` is its whole height; foot and capital keep their size.
 */
export const columnProfile = (rise: number): readonly [number, number][] => [
  [0, 0],
  [0.44, 0],
  [0.44, 0.022],
  [0.41, 0.04],
  [0.3, 0.062],
  [0.17, 0.1],
  [0.1, 0.16],
  [0.075, 0.23],
  [0.085, 0.255],
  [0.085, 0.275],
  [0.055, 0.3],
  [0.048, rise - 0.24],
  [0.064, rise - 0.22],
  [0.064, rise - 0.19],
  [0.05, rise - 0.17],
  [0.07, rise - 0.11],
  [0.15, rise - 0.04],
  [0.19, rise - 0.02],
  [0.19, rise],
  [0, rise]
]

/** The widest the column gets, at its foot, in arena units. */
export const COLUMN_FOOT_RADIUS = 0.44

/**
 * The table's cast-iron column, standing on the floor at its origin and
 * reaching `rise` arena units up to the table's underside. It casts its
 * shadow on the alcove's floor and back wall, and takes the table's.
 */
export const buildColumn = (iron: Color, rise: number): Mesh => {
  const column = new Mesh(
    new LatheGeometry(
      columnProfile(Math.max(rise, SHORTEST_RISE)).map(
        ([x, y]) => new Vector2(x, y)
      ),
      ROUND_SEGMENTS
    ),
    new MeshStandardMaterial({ color: iron, metalness: 0.55, roughness: 0.42 })
  )
  column.castShadow = true
  column.receiveShadow = true
  return column
}
