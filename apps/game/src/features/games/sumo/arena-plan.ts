/** The plan's radii, in arena units: the felt, its filets and its ticks, as the scene, its preview and the phone's stick all draw them. */
export const ARENA_PLAN = {
  centreRing: 0.503,
  centreSpot: 0.056,
  gutter: 1.14,
  gutterEdge: 1.135,
  rim: 0.991,
  tickRadius: 0.5,
  tickSize: 0.035,
  ticks: 8
} as const

/** Each brass filet's width across the table, in arena units. */
export const FILET_WIDTHS = {
  centreRing: 0.006,
  centreSpot: 0.012,
  gutterEdge: 0.01,
  rim: 0.018
} as const
