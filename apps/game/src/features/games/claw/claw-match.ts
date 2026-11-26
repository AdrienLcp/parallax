import type { SeatId } from '@parallax/protocol/identifiers'

import { CARRY_DROP, type ClawPit, PLUSH_RADIUS, REST_LIFT } from './claw-pit'
import { CLAW_STEP_SECONDS, CLAW_TUNING } from './claw-tuning'

/** A stick on the phone: `x` across, `z` towards the players, each from -1 to 1. */
export type ClawStick = { readonly x: number; readonly z: number }

export type PlushKind = 'bear' | 'bunny' | 'duck' | 'octopus'
export type PrizeKind = PlushKind | 'capsule'

const PLUSH_KINDS: readonly PlushKind[] = ['bear', 'bunny', 'duck', 'octopus']

/** How many fur colours a plush, or shell colours a capsule, is drawn from. */
export const PRIZE_TINTS = { capsule: 3, plush: 6 } as const

/**
 * A prize in the alcove. `resting` on the pile, `falling` back onto it (or
 * into a chute), `carried` under a claw, `sunk` once out of sight in a chute.
 */
export type Prize = {
  /** Seconds since it appeared: the renderer grows a new prize in. */
  age: number
  readonly id: number
  /** Falling into a chute: it sinks out of sight instead of resting. */
  intoChute: boolean
  readonly kind: PrizeKind
  /** Where it rests once it lands. */
  restY: number
  state: 'resting' | 'falling' | 'carried' | 'sunk'
  readonly tint: number
  vy: number
  x: number
  y: number
  readonly yaw: number
  z: number
}

/**
 * `aim`: hanging at roaming height, steered by its player, empty or holding a
 * prize. `drop`, `grip`, `lift`: down for a prize and back up, out of hand.
 */
export type ClawPhase = 'aim' | 'drop' | 'grip' | 'lift'

export type Claw = {
  /** The prize under it, `null` while empty. */
  carried: Prize | null
  /** How open its prongs are, 0 shut to 1 open. */
  open: number
  phase: ClawPhase
  /** Points scored so far. */
  score: number
  readonly seat: SeatId
  /** Where on its way up the carried prize slips out, `null` if it holds. */
  slipAt: number | null
  /** Seconds left in the grip. */
  timer: number
  x: number
  y: number
  z: number
}

/** A prize emptied into a chute: who scored it, what, and when in the round. */
export type ClawCatch = {
  readonly at: number
  readonly kind: PrizeKind
  readonly seat: SeatId
  readonly value: number
}

export type ClawMatchView = {
  readonly claws: readonly Claw[]
  readonly elapsed: number
  /** The last prize emptied into a chute, `null` before the first. */
  readonly lastCatch: ClawCatch | null
  /** Set once the round is decided: the seats with the best score, empty if nobody scored. */
  readonly outcome: { readonly winners: readonly SeatId[] } | null
  readonly prizes: readonly Prize[]
}

export type ClawMatchStep = {
  readonly drops: ReadonlySet<SeatId>
  readonly sticks: ReadonlyMap<SeatId, ClawStick>
  /** Every seat the room still holds: a player whose seat is gone leaves the game. */
  readonly seated: ReadonlySet<SeatId>
}

export type ClawMatch = {
  /** Steps the game by one fixed step; answers whether the match is over (its result shown long enough, or nobody left). */
  advance: (step: ClawMatchStep) => boolean
  view: () => ClawMatchView
}

export const prizeValue = (kind: PrizeKind): number =>
  kind === 'capsule' ? CLAW_TUNING.capsuleValue : 1

/** How open shut prongs stay, around a prize or on nothing. */
const GRIP_SHUT = 0.15

/**
 * The stick's response: a claw's speed grows with the square of the stick's
 * tilt, so a slight push creeps for a fine aim and a full one crosses fast.
 */
const AIM_CURVE = 2

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value))

/**
 * The claw game the screen runs: a pile of plush and capsules from wall to
 * wall, one claw a player on cables from the roof's rails. A player steers
 * their claw across and in depth while watching it, then sends it down: it
 * grips whatever lies under it and comes back up (a prize may slip out). The
 * player then steers the catch to a chute and lets go: over a chute it
 * scores, anywhere else it falls back onto the pile. A plush is worth 1, a
 * capsule more. When time is up the empty claws stop, the ones down or
 * holding a prize get a last few seconds to finish, and the best score wins.
 */
export const createClawMatch = ({
  pit,
  random,
  seats
}: {
  pit: ClawPit
  random: () => number
  /** The players, in seating order: their claws start spread across. */
  seats: readonly SeatId[]
}): ClawMatch => {
  let elapsed = 0
  let finishing = 0
  let decidedFor = 0
  let nextId = 0
  let lastCatch: ClawCatch | null = null
  let outcome: { winners: SeatId[] } | null = null
  let prizes: Prize[] = []

  /** The highest resting prize whose centre lies within `radius` of a point, across and in depth. */
  const topPrizeNear = (x: number, z: number, radius: number) => {
    let top: Prize | null = null
    for (const prize of prizes) {
      if (
        prize.state === 'resting' &&
        Math.hypot(prize.x - x, prize.z - z) < radius &&
        (top === null || prize.y > top.y)
      ) {
        top = prize
      }
    }
    return top
  }

  const addPrizes = (count: number, attempts: number) => {
    const { pile } = pit
    for (let attempt = 0; count > 0 && attempt < attempts; attempt += 1) {
      const x = pile.minX + random() * (pile.maxX - pile.minX)
      const z = pile.minZ + random() * (pile.maxZ - pile.minZ)
      if (!pit.inPile(x, z)) continue
      const restY = pit.surfaceY(x, z) + REST_LIFT
      const crowded = prizes.some(
        (prize) =>
          prize.state !== 'sunk' &&
          Math.hypot(prize.x - x, prize.restY - restY, prize.z - z) <
            PLUSH_RADIUS * 1.6
      )
      if (crowded) continue
      const isCapsule = random() < CLAW_TUNING.capsuleShare
      const kind: PrizeKind = isCapsule
        ? 'capsule'
        : (PLUSH_KINDS[Math.floor(random() * PLUSH_KINDS.length)] ?? 'bear')
      prizes.push({
        age: 0,
        id: nextId,
        intoChute: false,
        kind,
        restY,
        state: 'resting',
        tint: Math.floor(
          random() * (isCapsule ? PRIZE_TINTS.capsule : PRIZE_TINTS.plush)
        ),
        vy: 0,
        x,
        y: restY,
        yaw: (random() - 0.5) * 1.6,
        z
      })
      nextId += 1
      count -= 1
    }
  }

  addPrizes(CLAW_TUNING.pileCount, 4000)
  /** The pile as dealt: it is topped up once it runs `refillBelow` short of it. */
  const fullPile = prizes.length
  let sinceRefill = 0

  const { reach } = pit
  let claws: Claw[] = seats.map((seat, index) => ({
    carried: null,
    open: 1,
    phase: 'aim',
    score: 0,
    seat,
    slipAt: null,
    timer: 0,
    x: reach.minX + (reach.maxX - reach.minX) * ((index + 0.5) / seats.length),
    y: pit.roamY,
    z: reach.minZ + (reach.maxZ - reach.minZ) * (index % 2 ? 0.35 : 0.7)
  }))

  const isTimeUp = () => elapsed >= CLAW_TUNING.roundSeconds

  /** Lets go of a claw's prize where it hangs: into the chute below it, or back onto the pile. */
  const letGo = (claw: Claw) => {
    const prize = claw.carried
    if (prize === null) return
    prize.state = 'falling'
    prize.intoChute = pit.inChute(claw.x, claw.z)
    prize.vy = 0
    prize.x = claw.x
    prize.z = claw.z
    prize.restY = pit.surfaceY(claw.x, claw.z) + REST_LIFT
    claw.carried = null
  }

  const stepClaw = (claw: Claw, step: ClawMatchStep) => {
    const dt = CLAW_STEP_SECONDS
    switch (claw.phase) {
      case 'aim': {
        const prize = claw.carried
        claw.open = prize === null ? 1 : GRIP_SHUT
        claw.y += clamp(
          pit.roamY - claw.y,
          -CLAW_TUNING.liftSpeed * dt,
          CLAW_TUNING.liftSpeed * dt
        )
        if (isTimeUp() && prize === null) return
        const stick = step.sticks.get(claw.seat)
        if (stick !== undefined) {
          const length = Math.min(1, Math.hypot(stick.x, stick.z))
          if (length > 0) {
            const speed = CLAW_TUNING.aimSpeed * length ** AIM_CURVE
            const stride = (speed * dt) / length
            claw.x = clamp(claw.x + stick.x * stride, reach.minX, reach.maxX)
            claw.z = clamp(claw.z + stick.z * stride, reach.minZ, reach.maxZ)
          }
        }
        if (!step.drops.has(claw.seat)) return
        if (prize === null) {
          claw.phase = 'drop'
          return
        }
        if (pit.inChute(claw.x, claw.z)) {
          const value = prizeValue(prize.kind)
          claw.score += value
          lastCatch = { at: elapsed, kind: prize.kind, seat: claw.seat, value }
        }
        letGo(claw)
        claw.open = 1
        return
      }
      case 'drop': {
        const top = topPrizeNear(claw.x, claw.z, CLAW_TUNING.catchRadius)
        const base = top?.y ?? pit.surfaceY(claw.x, claw.z) + REST_LIFT
        const stop = base + PLUSH_RADIUS * 0.9 + 0.12
        claw.y -= CLAW_TUNING.dropSpeed * dt
        if (claw.y <= stop) {
          claw.y = stop
          claw.phase = 'grip'
          claw.timer = CLAW_TUNING.gripSeconds
        }
        return
      }
      case 'grip': {
        claw.timer -= dt
        claw.open = Math.max(GRIP_SHUT, claw.timer / CLAW_TUNING.gripSeconds)
        if (claw.timer > 0) return
        const caught = topPrizeNear(claw.x, claw.z, CLAW_TUNING.catchRadius)
        if (caught !== null) {
          caught.state = 'carried'
          claw.carried = caught
          const chance =
            caught.kind === 'capsule'
              ? CLAW_TUNING.slipChance.capsule
              : CLAW_TUNING.slipChance.plush
          claw.slipAt =
            random() < chance
              ? claw.y + (pit.roamY - claw.y) * (0.2 + random() * 0.6)
              : null
        }
        claw.phase = 'lift'
        return
      }
      case 'lift': {
        claw.y = Math.min(pit.roamY, claw.y + CLAW_TUNING.liftSpeed * dt)
        if (
          claw.carried !== null &&
          claw.slipAt !== null &&
          claw.y >= claw.slipAt
        ) {
          letGo(claw)
        }
        if (claw.y >= pit.roamY) claw.phase = 'aim'
        return
      }
      default:
        return claw.phase satisfies never
    }
  }

  /** Claws on the move push each other apart, so their prongs never cross. */
  const separate = () => {
    const movable = (claw: Claw) => claw.phase === 'aim'
    for (let i = 0; i < claws.length; i += 1) {
      for (let j = i + 1; j < claws.length; j += 1) {
        const a = claws[i]
        const b = claws[j]
        if (a === undefined || b === undefined) continue
        if (!movable(a) && !movable(b)) continue
        const dx = b.x - a.x
        const dz = b.z - a.z
        const distance = Math.hypot(dx, dz) || 0.001
        if (distance >= CLAW_TUNING.clawGap) continue
        const push = (CLAW_TUNING.clawGap - distance) / 2
        const share = movable(a) && movable(b) ? 1 : 2
        if (movable(a)) {
          a.x -= (dx / distance) * push * share
          a.z -= (dz / distance) * push * share
        }
        if (movable(b)) {
          b.x += (dx / distance) * push * share
          b.z += (dz / distance) * push * share
        }
      }
    }
    for (const claw of claws) {
      claw.x = clamp(claw.x, reach.minX, reach.maxX)
      claw.z = clamp(claw.z, reach.minZ, reach.maxZ)
    }
  }

  const stepPrizes = () => {
    const dt = CLAW_STEP_SECONDS
    for (const prize of prizes) {
      prize.age += dt
      if (prize.state !== 'falling') continue
      prize.vy -= CLAW_TUNING.gravity * dt
      prize.y += prize.vy * dt
      const floor = prize.intoChute ? pit.sunkY : prize.restY
      if (prize.y <= floor) {
        prize.y = floor
        prize.vy = 0
        prize.state = prize.intoChute ? 'sunk' : 'resting'
      }
    }
    for (const claw of claws) {
      if (claw.carried !== null) {
        claw.carried.x = claw.x
        claw.carried.y = claw.y - CARRY_DROP
        claw.carried.z = claw.z
      }
    }
    prizes = prizes.filter((prize) => prize.state !== 'sunk')
    sinceRefill += dt
    if (
      sinceRefill >= CLAW_TUNING.refillSeconds &&
      prizes.length < fullPile - CLAW_TUNING.refillBelow
    ) {
      sinceRefill = 0
      addPrizes(CLAW_TUNING.refillCount, 300)
    }
  }

  const decide = () => {
    const best = Math.max(0, ...claws.map((claw) => claw.score))
    outcome = {
      winners:
        best === 0
          ? []
          : claws.filter((claw) => claw.score === best).map((claw) => claw.seat)
    }
    for (const claw of claws) letGo(claw)
  }

  return {
    advance: (step) => {
      if (outcome !== null) {
        stepPrizes()
        decidedFor += CLAW_STEP_SECONDS
        return decidedFor >= CLAW_TUNING.decidedPauseSeconds
      }
      for (const claw of claws) {
        if (!step.seated.has(claw.seat)) letGo(claw)
      }
      claws = claws.filter((claw) => step.seated.has(claw.seat))
      if (claws.length === 0) return true

      elapsed = Math.min(elapsed + CLAW_STEP_SECONDS, CLAW_TUNING.roundSeconds)
      for (const claw of claws) stepClaw(claw, step)
      separate()
      stepPrizes()

      if (isTimeUp()) {
        finishing += CLAW_STEP_SECONDS
        const isSettled = claws.every(
          (claw) => claw.phase === 'aim' && claw.carried === null
        )
        if (isSettled || finishing >= CLAW_TUNING.longestFinishSeconds) {
          decide()
        }
      }
      return false
    },
    view: () => ({ claws, elapsed, lastCatch, outcome, prizes })
  }
}
