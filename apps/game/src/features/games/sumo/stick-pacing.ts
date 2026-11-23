import { SUMO_STICK_HZ } from '@parallax/protocol/sumo'

import type { PlanarVector } from '@/helpers/planar-vector'

export const STICK_SEND_INTERVAL_MS = 1000 / SUMO_STICK_HZ

/** A thumb never holds still to the hundredth: finer moves would bill a frame for nothing. */
const STICK_STEP = 0.02

const toStep = (axis: number): number => {
  const stepped = Math.round(axis / STICK_STEP) * STICK_STEP
  return Math.min(1, Math.max(-1, Number(stepped.toFixed(2))))
}

/** The stick as it goes on the wire: each axis on the step grid, within -1 and 1. */
export const steppedStick = (stick: PlanarVector): PlanarVector => ({
  x: toStep(stick.x),
  y: toStep(stick.y)
})

/** Whether `stick` is worth a frame, given the last one the screen received. */
export const hasStickMoved = (
  lastSent: PlanarVector | null,
  stick: PlanarVector
): boolean => {
  if (lastSent === null) {
    return true
  }

  const next = steppedStick(stick)
  return next.x !== lastSent.x || next.y !== lastSent.y
}
