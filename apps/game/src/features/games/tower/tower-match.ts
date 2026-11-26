import type { SeatId } from '@parallax/protocol/identifiers'
import type { TowerBlock, TowerRule } from '@parallax/protocol/tower'

import type { AlcoveInterior } from '@/features/alcove/alcove-bounds'

import { blockExtent, drawBlock, drawYaw } from './tower-blocks'
import type { BlockPose, TowerPhysics } from './tower-physics'
import { TOWER_STEP_SECONDS, TOWER_TUNING } from './tower-tuning'

/** A stick on the phone: `x` across, `z` towards the players, each from -1 to 1. */
export type TowerAim = { readonly x: number; readonly z: number }

/** The block a lane's player holds over the tower, before it is dropped. */
export type FloatingBlock = {
  readonly kind: TowerBlock
  readonly seat: SeatId
  /** Seconds it has floated: past `turnSeconds` it drops by itself. */
  readonly since: number
  readonly x: number
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
  readonly floating: FloatingBlock | null
  readonly halfWidth: number
  /** The lane's tallest standing point once it settled, in alcove units. */
  readonly height: number
  /** The block the lane's player is handed next. */
  readonly next: TowerBlock
  readonly seats: readonly SeatId[]
  /** The dropped block still moving, and since when. */
  readonly settling: {
    readonly for: number
    readonly handle: number
    readonly stillFor: number
  } | null
  /** Under `race`: how often this tower fell. */
  readonly toppled: number
  /** Under `shared`: whose turn it is, as an index into `seats`. */
  readonly turn: number
  readonly u: number
}

export type TowerOutcome =
  /** The shared tower fell: `seat` dropped the block that toppled it. */
  | { readonly kind: 'toppled'; readonly seat: SeatId }
  /** A tower reached the alcove's roof: everyone who built it wins. */
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
  /** Seats whose phone is connected: an absent player's turn is skipped. */
  readonly present: ReadonlySet<SeatId>
  /** Every seat the room still holds: a player whose seat is gone leaves the game. */
  readonly seated: ReadonlySet<SeatId>
}

export type TowerMatch = {
  /** Steps the game by one fixed step; answers whether the match is over (its result shown long enough, or too few players left). */
  advance: (step: TowerMatchStep) => boolean
  /** The height of the first surface under a lane's floating block. */
  landingOf: (lane: Lane) => number
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

/**
 * The tower game the screen runs on a physics world: blocks handed out at
 * random, aimed by each player's stick across and in depth, dropped by their
 * button. Under `shared` the room builds one tower in turns and whoever topples
 * it loses; a block that misses the tower is taken away and the turn passes.
 * Under `race` each player builds their own, a fallen tower starts
 * again from the floor, and the tallest when time is up wins.
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
    floating: null,
    height: 0,
    next: drawBlock(random),
    settling: null,
    toppled: 0,
    turn: 0
  }))

  const playerOf = (
    lane: Lane,
    present: ReadonlySet<SeatId>
  ): SeatId | null => {
    for (let offset = 0; offset < lane.seats.length; offset += 1) {
      const seat = lane.seats[(lane.turn + offset) % lane.seats.length]
      if (seat !== undefined && present.has(seat)) {
        return seat
      }
    }
    return null
  }

  const handOut = (lane: Lane, seat: SeatId): Lane => ({
    ...lane,
    floating: {
      kind: lane.next,
      seat,
      since: 0,
      x: lane.centre.x,
      yaw: drawYaw(lane.next, random),
      z: lane.centre.z
    },
    next: drawBlock(random)
  })

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
      settling: { for: 0, handle, stillFor: 0 }
    }
  }

  const liesOnFloor = (block: PlacedBlock): boolean =>
    physics.reach(block.handle).bottom < block.u * 0.05

  /** A block that stood on the tower before the last drop lies on the floor: the tower fell. */
  const hasFallen = (lane: Lane): boolean =>
    lane.blocks.slice(1, -1).some(liesOnFloor)

  /** The block just dropped lies on the floor beside a tower still standing: it missed. */
  const hasMissed = (lane: Lane): boolean => {
    const dropped = lane.blocks.at(-1)
    return (
      lane.blocks.length > 1 && dropped !== undefined && liesOnFloor(dropped)
    )
  }

  const heightOf = (lane: Lane): number =>
    lane.blocks.reduce(
      (top, block) => Math.max(top, physics.reach(block.handle).top),
      0
    )

  const settle = (lane: Lane, dropper: SeatId): Lane => {
    if (hasFallen(lane)) {
      if (rule === 'shared') {
        outcome = { kind: 'toppled', seat: dropper }
        return { ...lane, settling: null }
      }
      for (const block of lane.blocks) {
        physics.remove(block.handle)
      }
      return {
        ...lane,
        blocks: [],
        height: 0,
        settling: null,
        toppled: lane.toppled + 1
      }
    }
    if (hasMissed(lane)) {
      // Nobody toppled anything: the missed block goes, the turn passes.
      const missed = lane.blocks.at(-1)
      if (missed !== undefined) physics.remove(missed.handle)
      const blocks = lane.blocks.slice(0, -1)
      return {
        ...lane,
        blocks,
        height: heightOf({ ...lane, blocks }),
        settling: null,
        turn: lane.turn + 1
      }
    }
    const height = heightOf(lane)
    if (height >= towerCeiling(interior, lane.u)) {
      outcome = { kind: 'ceiling', seats: lane.seats }
    }
    return { ...lane, height, settling: null, turn: lane.turn + 1 }
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
      const dropper = lane.blocks.at(-1)?.seat
      if (
        dropper !== undefined &&
        (settling.stillFor >= TOWER_TUNING.restSeconds ||
          settling.for >= TOWER_TUNING.longestSettleSeconds)
      ) {
        return settle(lane, dropper)
      }
      return { ...lane, settling }
    }

    if (lane.floating === null) {
      const player = playerOf(lane, step.present)
      return player === null ? lane : handOut(lane, player)
    }

    const { seat } = lane.floating
    if (!step.present.has(seat)) {
      // The player left mid-turn: the block goes to whoever plays next.
      return {
        ...lane,
        floating: null,
        next: lane.floating.kind,
        turn: lane.turn + 1
      }
    }
    const floating = aimed(lane, lane.floating, step.aims.get(seat))
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
        lanes = lanes.map((lane) => ({ ...lane, floating: null }))
      }
      return false
    },
    landingOf: (lane) =>
      lane.floating === null
        ? 0
        : physics.surfaceBelow({
            x: lane.floating.x,
            y: hoverHeight(lane, lane.floating, interior),
            z: lane.floating.z
          }),
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
