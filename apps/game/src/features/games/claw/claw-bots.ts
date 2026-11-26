import type { SeatId } from '@parallax/protocol/identifiers'

import type { ClawMatch, ClawStick, Prize } from './claw-match'
import type { ClawPit } from './claw-pit'

type BotAim = {
  /** Seconds left to get there: a claw pushed off by another picks again. */
  patience: number
  readonly target: { readonly x: number; readonly z: number }
  /** Seconds it lingers over its target before dropping. */
  wait: number
}

/**
 * Bots playing the claw by themselves, for the showcase: each picks one of
 * the prizes nearest its claw, steers over it a little off, lingers, and
 * drops. Off by enough that a grip misses now and then.
 */
export const createClawBots = (random: () => number, pit: ClawPit) => {
  const aims = new Map<SeatId, BotAim>()

  const pick = (x: number, z: number, prizes: readonly Prize[]): BotAim => {
    const near = prizes
      .filter((prize) => prize.state === 'resting')
      .sort(
        (a, b) => Math.hypot(a.x - x, a.z - z) - Math.hypot(b.x - x, b.z - z)
      )
      .slice(0, 6)
    const prize = near[Math.floor(random() * near.length)]
    const { reach } = pit
    const clamp = (value: number, min: number, max: number) =>
      Math.min(max, Math.max(min, value))
    return {
      patience: 4,
      target: {
        x: clamp(
          (prize?.x ?? x) + (random() - 0.5) * 0.05,
          reach.minX,
          reach.maxX
        ),
        z: clamp(
          (prize?.z ?? z) + (random() - 0.5) * 0.09,
          reach.minZ,
          reach.maxZ
        )
      },
      wait: 0.4 + random() * 1.2
    }
  }

  return (
    match: ClawMatch,
    seconds: number
  ): { drops: Set<SeatId>; sticks: Map<SeatId, ClawStick> } => {
    const sticks = new Map<SeatId, ClawStick>()
    const drops = new Set<SeatId>()
    const { claws, prizes } = match.view()
    for (const claw of claws) {
      if (claw.phase !== 'aim') {
        aims.delete(claw.seat)
        continue
      }
      let aim = aims.get(claw.seat)
      if (aim === undefined) {
        aim = pick(claw.x, claw.z, prizes)
        aims.set(claw.seat, aim)
      }
      aim.patience -= seconds
      if (aim.patience <= 0) {
        aims.delete(claw.seat)
        continue
      }
      const dx = aim.target.x - claw.x
      const dz = aim.target.z - claw.z
      if (Math.hypot(dx, dz) > 0.008) {
        sticks.set(claw.seat, {
          x: Math.max(-1, Math.min(1, dx / 0.06)),
          z: Math.max(-1, Math.min(1, dz / 0.06))
        })
        continue
      }
      aim.wait -= seconds
      if (aim.wait <= 0) {
        drops.add(claw.seat)
        aims.delete(claw.seat)
      }
    }
    return { drops, sticks }
  }
}
