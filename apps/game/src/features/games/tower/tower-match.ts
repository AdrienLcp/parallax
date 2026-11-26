import type { SeatId } from '@parallax/protocol/identifiers'
import type { TowerBlock, TowerRule } from '@parallax/protocol/tower'

import type { AlcoveInterior } from '@/features/alcove/alcove-bounds'

import { blockExtent, drawOffer } from './tower-blocks'
import type { BlockPose, TowerPhysics } from './tower-physics'
import { TOWER_STEP_SECONDS, TOWER_TUNING } from './tower-tuning'

/** A stick on the phone: `x` across, `z` towards the players, each from -1 to 1. */
export type TowerAim = { readonly x: number; readonly z: number }

/** Which of the two blocks on offer the player holds. */
export type OfferChoice = 0 | 1

/** Two blocks to pick from, never the same. */
export type TowerOffer = readonly [TowerBlock, TowerBlock]

/** The block a lane's player holds over the tower, before it is dropped. */
export type FloatingBlock = {
  readonly choice: OfferChoice
  /** The block held: `offer[choice]`. */
  readonly kind: TowerBlock
  readonly offer: TowerOffer
  readonly seat: SeatId
  /** Seconds it has floated: past `turnSeconds` it drops by itself. */
  readonly since: number
  readonly x: number
  /** How the block is turned on itself, in radians, the player's to change. */
  readonly yaw: number
  readonly z: number
}

/** A block dropped in the alcove, and whose it is. */
export type PlacedBlock = {
  readonly handle: number
  readonly kind: TowerBlock
  readonly seat: SeatId
  readonly u: number
}

/** One tower and who builds it: the whole room in turns under `shared`, one player each under `race`. */
export type Lane = {
  readonly blocks: readonly PlacedBlock[]
  /** Where the tower stands, and how far its floating block may stray across. */
  readonly centre: { readonly x: number; readonly z: number }
  /** Under `shared`: the blocks that last came down, whose drop brought them down, and when. */
  readonly fall: {
    readonly at: number
    readonly count: number
    readonly seat: SeatId
  } | null
  readonly floating: FloatingBlock | null
  readonly halfWidth: number
  /** The lane's tallest standing point once it settled, in alcove units. */
  readonly height: number
  /** The blocks the lane's next player picks from. */
  readonly offer: TowerOffer
  /** Under `shared`: blocks each seat brought down, taken off its score. */
  readonly penalties: ReadonlyMap<SeatId, number>
  /** Under `shared`: blocks each seat dropped so far, out of `blocksEach`. */
  readonly played: ReadonlyMap<SeatId, number>
  /** How low each block reached when the tower last settled: one that sank well below has fallen. */
  readonly rests: ReadonlyMap<number, number>
  readonly seats: readonly SeatId[]
  /** The tower still moving, and since when: after a drop (`dropper` set), or after fallen blocks were taken away. */
  readonly settling: {
    readonly dropper: SeatId | null
    readonly for: number
    readonly stillFor: number
  } | null
  /** Under `race`: how often this tower fell. */
  readonly toppled: number
  /** Under `shared`: whose turn it is, as an index into `seats`. */
  readonly turn: number
  readonly u: number
}

export type TowerOutcome =
  /** The shared game's blocks are all played, or its tower reached the roof: the best score wins, `null` on a tie. */
  | { readonly kind: 'scored'; readonly seat: SeatId | null }
  /** A race tower reached the alcove's roof: whoever built it wins. */
  | { readonly kind: 'ceiling'; readonly seats: readonly SeatId[] }
  /** The race's time is up: the tallest tower wins, `null` on a tie. */
  | { readonly kind: 'tallest'; readonly seat: SeatId | null }

export type TowerMatchView = {
  readonly elapsed: number
  readonly lanes: readonly Lane[]
  /** Set once the game is decided; the room reads it for a few seconds before the match ends. */
  readonly outcome: TowerOutcome | null
  readonly rule: TowerRule
}

export type TowerMatchStep = {
  readonly aims: ReadonlyMap<SeatId, TowerAim>
  readonly drops: ReadonlySet<SeatId>
  /** The block each player asked to hold, since the last step. */
  readonly picks: ReadonlyMap<SeatId, OfferChoice>
  /** Seats whose phone is connected: an absent player's turn is skipped. */
  readonly present: ReadonlySet<SeatId>
  /** Every seat the room still holds: a player whose seat is gone leaves the game. */
  readonly seated: ReadonlySet<SeatId>
  /** Each player's second stick: how fast their block turns, from -1 to 1, clockwise positive. */
  readonly spins: ReadonlyMap<SeatId, number>
}

export type TowerMatch = {
  /** Steps the game by one fixed step; answers whether the match is over (its result shown long enough, or too few players left). */
  advance: (step: TowerMatchStep) => boolean
  poseOf: (handle: number) => BlockPose
  view: () => TowerMatchView
}

const hoverHeight = (
  lane: Lane,
  floating: FloatingBlock,
  interior: AlcoveInterior
): number => {
  const extent = blockExtent(floating.kind, lane.u, floating.yaw)
  return Math.min(
    lane.height + TOWER_TUNING.hoverGap + extent.below,
    interior.y.max - TOWER_TUNING.bob - extent.above
  )
}

/** How high a tower may grow before it touches the roof: the tallest block must still float above it. */
export const towerCeiling = (interior: AlcoveInterior, u: number): number =>
  interior.y.max -
  TOWER_TUNING.bob -
  TOWER_TUNING.hoverGap -
  blockExtent('cylinder', u, 0).above * 2

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value))

/**
 * Lays the lanes out: one tower in the middle under `shared`, or one per
 * player side by side under `race`, the blocks narrowed so each lane holds a
 * plank laid across.
 */
export const laneLayout = ({
  interior,
  rule,
  seats
}: {
  interior: AlcoveInterior
  rule: TowerRule
  seats: readonly SeatId[]
}): {
  centre: { x: number; z: number }
  halfWidth: number
  seats: SeatId[]
  u: number
}[] => {
  const z = (interior.z.min + interior.floorFront) / 2
  const width = interior.x.max - interior.x.min
  if (rule === 'shared') {
    return [
      {
        centre: { x: 0, z },
        halfWidth: width / 2,
        seats: [...seats],
        u: TOWER_TUNING.sharedUnit
      }
    ]
  }
  const laneWidth = width / seats.length
  const u = Math.min(TOWER_TUNING.sharedUnit, laneWidth / 3.4)
  return seats.map((seat, index) => ({
    centre: { x: interior.x.min + laneWidth * (index + 0.5), z },
    halfWidth: laneWidth / 2,
    seats: [seat],
    u
  }))
}

/** A shared lane's score for one seat: its blocks standing, less those it brought down. */
export const scoreOf = (lane: Lane, seat: SeatId): number =>
  lane.blocks.filter((block) => block.seat === seat).length -
  (lane.penalties.get(seat) ?? 0)

/** The best score of a shared lane, `null` on a tie at the top. */
const bestOf = (lane: Lane): SeatId | null => {
  const ranked = [...lane.seats].sort(
    (a, b) => scoreOf(lane, b) - scoreOf(lane, a)
  )
  const [first, second] = ranked
  if (first === undefined) return null
  return second !== undefined && scoreOf(lane, second) === scoreOf(lane, first)
    ? null
    : first
}

const FULL_TURN = 2 * Math.PI

/**
 * The tower game the screen runs on a physics world: each player picks one of
 * two blocks drawn at random, aims it across and in depth with one stick,
 * turns it on itself with the other and drops it with their button. Under `shared` the
 * room builds one tower in turns, `blocksEach` blocks a player: a block
 * standing is a point for whoever laid it, and the blocks a drop brings down
 * are taken away and off the dropper's score; the tower stands again on what
 * is left. A block that misses the tower is taken away and the turn passes.
 * Under `race` each player builds their own, a fallen tower starts again from
 * the floor, and the tallest when time is up wins.
 */
export const createTowerMatch = ({
  interior,
  physics,
  random,
  rule,
  seats
}: {
  interior: AlcoveInterior
  physics: TowerPhysics
  random: () => number
  rule: TowerRule
  /** The players, in seating order: the shared tower's turns follow it. */
  seats: readonly SeatId[]
}): TowerMatch => {
  let elapsed = 0
  let outcome: TowerOutcome | null = null
  let decidedFor = 0
  let lanes: Lane[] = laneLayout({ interior, rule, seats }).map((layout) => ({
    ...layout,
    blocks: [],
    fall: null,
    floating: null,
    height: 0,
    offer: drawOffer(random),
    penalties: new Map(),
    played: new Map(),
    rests: new Map(),
    settling: null,
    toppled: 0,
    turn: 0
  }))

  const hasTurnsLeft = (lane: Lane, seat: SeatId): boolean =>
    rule === 'race' || (lane.played.get(seat) ?? 0) < TOWER_TUNING.blocksEach

  const playerOf = (
    lane: Lane,
    present: ReadonlySet<SeatId>
  ): SeatId | null => {
    for (let offset = 0; offset < lane.seats.length; offset += 1) {
      const seat = lane.seats[(lane.turn + offset) % lane.seats.length]
      if (seat !== undefined && present.has(seat) && hasTurnsLeft(lane, seat)) {
        return seat
      }
    }
    return null
  }

  const handOut = (lane: Lane, seat: SeatId): Lane => ({
    ...lane,
    floating: {
      choice: 0,
      kind: lane.offer[0],
      offer: lane.offer,
      seat,
      since: 0,
      x: lane.centre.x,
      yaw: 0,
      z: lane.centre.z
    },
    offer: drawOffer(random)
  })

  /** The block the player holds and how it is turned, as their pick and second stick ask. */
  const handled = (
    floating: FloatingBlock,
    step: TowerMatchStep
  ): FloatingBlock => {
    const choice = step.picks.get(floating.seat) ?? floating.choice
    const rate = clamp(step.spins.get(floating.seat) ?? 0, -1, 1)
    if (choice === floating.choice && rate === 0) {
      return floating
    }
    // A positive yaw turns anticlockwise seen from above: turning clockwise takes it down.
    const yaw =
      (floating.yaw - rate * TOWER_TUNING.spinSpeed * TOWER_STEP_SECONDS) %
      FULL_TURN
    return {
      ...floating,
      choice,
      kind: floating.offer[choice],
      yaw: yaw < 0 ? yaw + FULL_TURN : yaw
    }
  }

  /** The block's centre kept so its surface stays in the lane and the interior. */
  const aimed = (
    lane: Lane,
    floating: FloatingBlock,
    aim: TowerAim | undefined
  ) => {
    const extent = blockExtent(floating.kind, lane.u, floating.yaw)
    const length = aim === undefined ? 0 : Math.hypot(aim.x, aim.z)
    const scale = length > 1 ? 1 / length : 1
    const reach = TOWER_TUNING.aimSpeed * TOWER_STEP_SECONDS * scale
    const left =
      Math.max(interior.x.min, lane.centre.x - lane.halfWidth) + extent.hx
    const right =
      Math.min(interior.x.max, lane.centre.x + lane.halfWidth) - extent.hx
    return {
      ...floating,
      since: floating.since + TOWER_STEP_SECONDS,
      x: clamp(floating.x + (aim?.x ?? 0) * reach, left, right),
      z: clamp(
        floating.z + (aim?.z ?? 0) * reach,
        interior.z.min + extent.hz,
        interior.floorFront - extent.hz
      )
    }
  }

  const dropFloating = (lane: Lane, floating: FloatingBlock): Lane => {
    const handle = physics.drop({
      kind: floating.kind,
      u: lane.u,
      x: floating.x,
      y: hoverHeight(lane, floating, interior),
      yaw: floating.yaw,
      z: floating.z
    })
    return {
      ...lane,
      blocks: [
        ...lane.blocks,
        { handle, kind: floating.kind, seat: floating.seat, u: lane.u }
      ],
      floating: null,
      played: new Map(lane.played).set(
        floating.seat,
        (lane.played.get(floating.seat) ?? 0) + 1
      ),
      settling: { dropper: floating.seat, for: 0, stillFor: 0 }
    }
  }

  const liesOnFloor = (block: PlacedBlock): boolean =>
    physics.reach(block.handle).bottom < block.u * 0.05

  /** Blocks that had settled and have since sunk by half a unit or more: they came down. */
  const fallenOf = (lane: Lane): PlacedBlock[] =>
    lane.blocks.filter((block) => {
      const rest = lane.rests.get(block.handle)
      return (
        rest !== undefined &&
        physics.reach(block.handle).bottom < rest - block.u * 0.5
      )
    })

  const heightOf = (blocks: readonly PlacedBlock[]): number =>
    blocks.reduce(
      (top, block) => Math.max(top, physics.reach(block.handle).top),
      0
    )

  /** The lane once its blocks lie still: how low each reaches noted, its height read. */
  const rested = (lane: Lane, blocks: readonly PlacedBlock[]): Lane => ({
    ...lane,
    blocks,
    height: heightOf(blocks),
    rests: new Map(
      blocks.map((block) => [block.handle, physics.reach(block.handle).bottom])
    ),
    settling: null
  })

  const without = (
    blocks: readonly PlacedBlock[],
    gone: readonly PlacedBlock[]
  ): PlacedBlock[] => {
    for (const block of gone) physics.remove(block.handle)
    return blocks.filter((block) => !gone.includes(block))
  }

  const settle = (lane: Lane, dropper: SeatId | null): Lane => {
    const fallen = fallenOf(lane)
    const dropped = dropper === null ? undefined : lane.blocks.at(-1)
    const isMissed =
      dropped !== undefined &&
      lane.blocks.length > 1 &&
      !lane.rests.has(dropped.handle) &&
      liesOnFloor(dropped)
    const turn = dropper === null ? lane.turn : lane.turn + 1

    if (fallen.length > 0 && rule === 'race') {
      without(lane.blocks, lane.blocks)
      return { ...rested(lane, []), toppled: lane.toppled + 1, turn }
    }

    if (fallen.length > 0) {
      // The dropped block came down with the rest: it scores nothing either.
      const gone =
        isMissed && dropped !== undefined ? [...fallen, dropped] : fallen
      const blocks = without(lane.blocks, gone)
      // What stood on the blocks taken away may still move: the tower settles
      // again, blamed on nobody, before the next block is handed out.
      return {
        ...lane,
        blocks,
        fall:
          dropper === null
            ? lane.fall
            : { at: elapsed, count: fallen.length, seat: dropper },
        penalties:
          dropper === null
            ? lane.penalties
            : new Map(lane.penalties).set(
                dropper,
                (lane.penalties.get(dropper) ?? 0) + fallen.length
              ),
        settling: { dropper: null, for: 0, stillFor: 0 },
        turn
      }
    }

    const blocks =
      isMissed && dropped !== undefined
        ? without(lane.blocks, [dropped])
        : lane.blocks
    const settled = { ...rested(lane, blocks), turn }
    if (settled.height >= towerCeiling(interior, lane.u)) {
      outcome =
        rule === 'shared'
          ? { kind: 'scored', seat: bestOf(settled) }
          : { kind: 'ceiling', seats: lane.seats }
    }
    return settled
  }

  const stepLane = (lane: Lane, step: TowerMatchStep): Lane => {
    if (lane.settling !== null) {
      const handles = lane.blocks.map((block) => block.handle)
      const isStill = handles.every((handle) => physics.isStill(handle))
      const settling = {
        ...lane.settling,
        for: lane.settling.for + TOWER_STEP_SECONDS,
        stillFor: isStill ? lane.settling.stillFor + TOWER_STEP_SECONDS : 0
      }
      if (
        settling.stillFor >= TOWER_TUNING.restSeconds ||
        settling.for >= TOWER_TUNING.longestSettleSeconds
      ) {
        return settle(lane, settling.dropper)
      }
      return { ...lane, settling }
    }

    if (lane.floating === null) {
      if (!lane.seats.some((seat) => hasTurnsLeft(lane, seat))) {
        outcome = { kind: 'scored', seat: bestOf(lane) }
        return lane
      }
      const player = playerOf(lane, step.present)
      return player === null ? lane : handOut(lane, player)
    }

    const { seat } = lane.floating
    if (!step.present.has(seat)) {
      // The player left mid-turn: their blocks go to whoever plays next.
      return {
        ...lane,
        floating: null,
        offer: lane.floating.offer,
        turn: lane.turn + 1
      }
    }
    const floating = aimed(
      lane,
      handled(lane.floating, step),
      step.aims.get(seat)
    )
    return step.drops.has(seat) || floating.since >= TOWER_TUNING.turnSeconds
      ? dropFloating(lane, floating)
      : { ...lane, floating }
  }

  const tallest = (): TowerOutcome => {
    const ranked = [...lanes].sort((a, b) => b.height - a.height)
    const [first, second] = ranked
    const isTie =
      first === undefined ||
      first.height === 0 ||
      (second !== undefined && second.height === first.height)
    return { kind: 'tallest', seat: isTie ? null : (first.seats[0] ?? null) }
  }

  return {
    advance: (step) => {
      physics.step()
      if (outcome !== null) {
        decidedFor += TOWER_STEP_SECONDS
        return decidedFor >= TOWER_TUNING.decidedPauseSeconds
      }
      lanes = lanes.map((lane) => ({
        ...lane,
        seats: lane.seats.filter((seat) => step.seated.has(seat))
      }))
      const players = new Set(lanes.flatMap((lane) => lane.seats))
      if (players.size < 2 && rule === 'shared') {
        return true
      }
      if (players.size === 0) {
        return true
      }
      elapsed += TOWER_STEP_SECONDS
      lanes = lanes.map((lane) =>
        lane.seats.length === 0 ? lane : stepLane(lane, step)
      )
      if (
        outcome === null &&
        rule === 'race' &&
        elapsed >= TOWER_TUNING.raceSeconds
      ) {
        outcome = tallest()
      }
      if (outcome !== null) {
        lanes = lanes.map((lane) => ({ ...lane, floating: null }))
      }
      return false
    },
    poseOf: physics.pose,
    view: () => ({ elapsed, lanes, outcome, rule })
  }
}

/** The floating block's centre height, for the renderer. */
export const floatingHeight = (lane: Lane, interior: AlcoveInterior): number =>
  lane.floating === null ? 0 : hoverHeight(lane, lane.floating, interior)

/** A lane's height read on the chart, in centimetres. */
export const heightCm = (height: number): number =>
  Math.round(height * TOWER_TUNING.cmPerUnit)

/** The seconds before a floating block drops by itself. */
export const secondsLeftOf = (floating: FloatingBlock): number =>
  Math.max(0, TOWER_TUNING.turnSeconds - floating.since)
