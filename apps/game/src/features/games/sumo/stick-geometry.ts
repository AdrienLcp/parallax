import {
  clampedLength,
  ORIGIN,
  type PlanarVector,
  scaled
} from '@/helpers/planar-vector'

/** How far the knob may leave the centre, as a share of the base's radius: up to the plan's ring. */
export const KNOB_TRAVEL_SHARE = 0.66

/** How much of the base's radius stays inside the pad when a thumb lands near its edge. */
const ANCHOR_INSET_SHARE = 0.6

/** A still top still turns; a pushed one turns this much faster at full stick. */
const KNOB_RESTING_TURNS_PER_SECOND = 0.35
const KNOB_PUSHED_TURNS_PER_SECOND = 2.2

export type PadSize = {
  readonly height: number
  readonly width: number
}

const clamped = ({
  value,
  lowest,
  highest
}: {
  value: number
  lowest: number
  highest: number
}): number => Math.min(Math.max(value, lowest), highest)

/**
 * Where the base settles under a thumb landing at `point`, in pixels from the
 * pad's top-left corner: pulled inside so that most of it stays in sight.
 */
export const stickAnchor = ({
  baseRadius,
  pad,
  point
}: {
  baseRadius: number
  pad: PadSize
  point: PlanarVector
}): PlanarVector => {
  const inset = baseRadius * ANCHOR_INSET_SHARE

  return {
    x: clamped({ highest: pad.width - inset, lowest: inset, value: point.x }),
    y: clamped({ highest: pad.height - inset, lowest: inset, value: point.y })
  }
}

export type StickReading = {
  /** Where the knob is drawn, in pixels from the anchor, never past `travel`. */
  readonly knob: PlanarVector
  /** What the screen hears: the same direction inside the unit disc, `y` growing downwards. */
  readonly stick: PlanarVector
}

/** Reads the thumb's `offset` from the anchor, in pixels, against the knob's `travel`. */
export const stickReading = ({
  offset,
  travel
}: {
  offset: PlanarVector
  travel: number
}): StickReading => {
  if (travel <= 0) {
    return { knob: ORIGIN, stick: ORIGIN }
  }

  const knob = clampedLength(offset, travel)

  return { knob, stick: scaled(knob, 1 / travel) }
}

/** How fast the knob's top turns for a stick pushed `stickLength` (0 to 1) from the centre. */
export const knobTurnsPerSecond = (stickLength: number): number =>
  KNOB_RESTING_TURNS_PER_SECOND + stickLength * KNOB_PUSHED_TURNS_PER_SECOND
