import type { SeatId } from '@parallax/protocol/identifiers'

import type { Lane, OfferChoice, TowerAim, TowerMatch } from './tower-match'

/** How long a bot takes over its aim before dropping, at least. */
const BOT_THINK_SECONDS = 1.1

type BotAim = { readonly target: { x: number; z: number } }

/**
 * Bots playing the tower by themselves, for the showcase: each aims its
 * floating block at the top of its tower, a little off, then drops it once
 * there. Off by enough that the shared tower falls now and then.
 */
export const createTowerBots = (random: () => number) => {
  const aims = new Map<SeatId, BotAim>()

  const targetOf = (lane: Lane, match: TowerMatch) => {
    const top = lane.blocks.at(-1)
    const base =
      top === undefined ? lane.centre : match.poseOf(top.handle).position
    const wobble = lane.u * 0.7
    return {
      x: base.x + (random() - 0.5) * wobble,
      z: base.z + (random() - 0.5) * wobble
    }
  }

  return (
    match: TowerMatch
  ): {
    aims: Map<SeatId, TowerAim>
    drops: Set<SeatId>
    picks: Map<SeatId, OfferChoice>
    spins: Map<SeatId, number>
  } => {
    const sticks = new Map<SeatId, TowerAim>()
    const drops = new Set<SeatId>()
    const picks = new Map<SeatId, OfferChoice>()
    for (const lane of match.view().lanes) {
      const { floating } = lane
      if (floating === null) {
        continue
      }
      let aim = aims.get(floating.seat)
      if (aim === undefined || floating.since === 0) {
        aim = { target: targetOf(lane, match) }
        aims.set(floating.seat, aim)
        // A bot builds: it takes the plank or the cube when one is on offer.
        const builder = floating.offer.findIndex(
          (kind) => kind === 'plank' || kind === 'cube'
        )
        if (builder === 1) picks.set(floating.seat, 1)
      }
      const dx = aim.target.x - floating.x
      const dz = aim.target.z - floating.z
      const gap = Math.hypot(dx, dz)
      sticks.set(floating.seat, {
        x: Math.max(-1, Math.min(1, dx / 0.05)),
        z: Math.max(-1, Math.min(1, dz / 0.05))
      })
      if (gap < 0.004 && floating.since > BOT_THINK_SECONDS) {
        drops.add(floating.seat)
        aims.delete(floating.seat)
      }
    }
    return { aims: sticks, drops, picks, spins: new Map() }
  }
}
