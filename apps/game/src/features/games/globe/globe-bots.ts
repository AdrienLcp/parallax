import type { SeatId } from '@parallax/protocol/identifiers'

import type { GlobeJudge } from './globe-atlas'
import type { GeoPoint } from './globe-distance'
import type { GlobeInput, GlobeMatch, GlobeStick } from './globe-match'

/** How long a bot looks before it starts turning the globe. */
const BOT_THINK_SECONDS = 0.8
/** How far off a bot aims, at most, in degrees. */
const BOT_MISS_DEGREES = 6

const clamp = (value: number) => Math.max(-1, Math.min(1, value))

/**
 * Bots playing Terre by themselves, for the showcase: the holder steers the
 * crosshair toward the place, a few degrees off, and plants once there.
 * A country is aimed at its nearest border from where the turn begins, then a
 * little inside.
 */
export const createGlobeBots = (random: () => number, judge: GlobeJudge) => {
  let target: { seat: SeatId; spot: GeoPoint; turn: number } | null = null
  let thinking = 0

  return (match: GlobeMatch, seconds: number): GlobeInput => {
    const view = match.view()
    const sticks = new Map<SeatId, GlobeStick>()
    const plants = new Set<SeatId>()
    const seated = new Set<SeatId>(view.scores.keys())
    const { turn } = view
    if (turn === null) {
      target = null
      return { plants, seated, sticks, zooms: new Map() }
    }
    if (target === null || target.turn !== view.turns.played) {
      const { answer } = judge(turn.place, view.aim)
      const spot = answer ?? view.aim
      const miss = () => (random() - 0.5) * 2 * BOT_MISS_DEGREES
      target = {
        seat: turn.seat,
        spot: {
          latitude: spot.latitude + miss(),
          longitude: spot.longitude + miss()
        },
        turn: view.turns.played
      }
      thinking = 0
    }
    thinking += seconds
    if (thinking < BOT_THINK_SECONDS) {
      return { plants, seated, sticks, zooms: new Map() }
    }
    const north = target.spot.latitude - view.aim.latitude
    const east =
      ((((target.spot.longitude - view.aim.longitude + 180) % 360) + 360) %
        360) -
      180
    const gap = Math.hypot(north, east)
    sticks.set(target.seat, { x: clamp(east / 25), y: clamp(north / 25) })
    if (gap < 1.5) plants.add(target.seat)
    return { plants, seated, sticks, zooms: new Map() }
  }
}
