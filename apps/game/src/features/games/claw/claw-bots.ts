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
 * grabs; off by enough that a grip misses now and then. Holding a prize, it
 * steers to the nearest chute and lets go.
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

  /** Over the nearest chute, as far in as the claw reaches. */
  const toChute = (x: number): BotAim => {
    const [left, right] = pit.chutes
    const chute = Math.abs(left.x - x) < Math.abs(right.x - x) ? left : right
    const { reach } = pit
    return {
      patience: 6,
      target: {
        x: Math.min(reach.maxX, Math.max(reach.minX, chute.x)),
        z: Math.min(reach.maxZ, Math.max(reach.minZ, chute.z))
      },
      wait: 0.2 + random() * 0.4
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
        aim =
          claw.carried === null ? pick(claw.x, claw.z, prizes) : toChute(claw.x)
        aims.set(claw.seat, aim)
      }
      aim.patience -= seconds
      if (aim.patience <= 0) {
        aims.delete(claw.seat)
        continue
      }
      const dx = aim.target.x - claw.x
      const dz = aim.target.z - claw.z
      const distance = Math.hypot(dx, dz)
      if (distance > 0.008) {
        // The claw's speed grows with the square of the tilt: a root keeps the approach brisk.
        const tilt = Math.sqrt(Math.min(1, distance / 0.06))
        sticks.set(claw.seat, {
          x: (dx / distance) * tilt,
          z: (dz / distance) * tilt
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
