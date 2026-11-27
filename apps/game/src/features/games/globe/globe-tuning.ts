import type { GlobePlaceKind } from '@parallax/protocol/globe'

/** Seated players Terre needs, and the most it takes: one holds the globe at a time, so one is enough. */
export const GLOBE_PLAYERS = { fewest: 1, most: 6 } as const

/** The game steps at this fixed rate whatever the display's refresh. */
export const GLOBE_STEP_SECONDS = 1 / 120

/** A frame longer than this (a tab come back to the front) is not caught up. */
export const LONGEST_FRAME_SECONDS = 0.25

/** How often the screen tells the phones the game's state, at most. */
export const GLOBE_STATE_REPORT_SECONDS = 0.2

/**
 * How near a pin must land to be paid, by what was asked (melee's
 * `DISTANCE_REACH`): anywhere under `fullPayKm` pays the whole turn, nothing
 * past `zeroPayKm`, a straight line between. A country is paid in full only
 * inside it.
 */
export const GLOBE_REACH = {
  city: { fullPayKm: 100, zeroPayKm: 1_000 },
  country: { fullPayKm: 0, zeroPayKm: 1_500 },
  monument: { fullPayKm: 100, zeroPayKm: 1_000 },
  mountain: { fullPayKm: 100, zeroPayKm: 1_000 }
} as const satisfies Record<
  GlobePlaceKind,
  { fullPayKm: number; zeroPayKm: number }
>

export const GLOBE_TUNING = {
  /** Seconds the winner stays on the display before the room goes back to its lobby. */
  decidedPauseSeconds: 6,
  /** How fast the globe coasts to a stop once the stick lets go: the speed's share kept is `exp(-drag × seconds)`. */
  drag: 2.6,
  /** How long the globe takes to turn from the pin to where the pin and the answer both show. */
  flightSeconds: 1.6,
  /** The crosshair stops this far from either pole: the globe would turn on itself past it. */
  latitudeLimit: 72,
  /** The loupe's magnification, from just opened to fully in. */
  magnify: { max: 7, min: 2.5 },
  /** What a turn pays at most: a pin on the place, planted at once. */
  mostPoints: 1000,
  /** A full stick's push on the crosshair, in degrees of ground a second squared. */
  push: 150,
  /** How long the pin and the answer stay shown before the next turn. */
  revealSeconds: 4.5,
  /** Share of a turn's points the clock takes: planted at the last moment, a perfect pin pays the rest. */
  timeShare: 0.5,
  /** How long the holder has to plant; then the pin goes in where the crosshair is. */
  turnSeconds: 20,
  /** How many turns each player holds the globe. */
  turnsEach: 3,
  /** How fast a full second stick opens the loupe, as a share of its range a second. */
  zoomSpeed: 0.9
} as const
