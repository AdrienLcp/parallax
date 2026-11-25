import { useEffect, useEffectEvent, useRef, useState } from 'react'

import type { SeatId } from '@parallax/protocol/identifiers'
import type { ScreenRoomMessage } from '@parallax/protocol/server-message'
import { DEFAULT_TOWER_RULE, type TowerRule } from '@parallax/protocol/tower'

import type { AlcoveInterior } from '@/features/alcove/alcove-bounds'
import type { EventSubscription } from '@/helpers/event-channel'
import type { RoomSocket } from '@/infrastructure/messaging/use-room-socket'

import type { ScreenGameEvent } from '../game-definition'
import { loadRapier } from './load-rapier'
import {
  createTowerMatch,
  type TowerAim,
  type TowerMatch,
  type TowerMatchView
} from './tower-match'
import { createTowerPhysics, type Rapier } from './tower-physics'
import { reportedState } from './tower-state-report'
import {
  LONGEST_FRAME_SECONDS,
  TOWER_PLAYERS,
  TOWER_STATE_REPORT_SECONDS,
  TOWER_STEP_SECONDS
} from './tower-tuning'

type TowerSimulationInput = {
  events: EventSubscription<ScreenGameEvent>
  interior: AlcoveInterior
  /** Called on every display frame with the match as it stands (`null` while the room gathers) and the wall time since the last one. */
  onFrame: (match: TowerMatch | null, seconds: number) => void
  room: ScreenRoomMessage
  send: RoomSocket['send']
}

export type TowerSimulation = {
  /** The rule the next game plays, as the phones picked it. */
  readonly rule: TowerRule
  /** The match's view when its standings changed, `null` while the room gathers. */
  readonly view: TowerMatchView | null
}

/** What of a view changes the standings: the rest moves every frame. */
const standingsKey = (view: TowerMatchView): string =>
  JSON.stringify({
    heights: view.lanes.map((lane) => Math.round(lane.height * 160)),
    outcome: view.outcome,
    seconds: Math.ceil(view.elapsed),
    turns: view.lanes.map((lane) => lane.floating?.seat ?? null)
  })

/**
 * Runs the tower on the screen: hears the phones' aims, drops and rule choice,
 * starts a game once every present player is ready and tells the room their
 * marks are spent, steps the physics at a fixed rate whatever the display's
 * refresh, tells the phones when the game's state changes, and tells the room
 * when the game is over.
 */
export const useTowerSimulation = ({
  events,
  interior,
  onFrame,
  room,
  send
}: TowerSimulationInput): TowerSimulation => {
  const [rule, setRule] = useState<TowerRule>(DEFAULT_TOWER_RULE)
  const [view, setView] = useState<TowerMatchView | null>(null)
  const ruleRef = useRef<TowerRule>(DEFAULT_TOWER_RULE)
  const aims = useRef(new Map<SeatId, TowerAim>())
  const drops = useRef(new Set<SeatId>())
  const present = useRef<readonly SeatId[]>([])
  const ready = useRef<ReadonlySet<SeatId>>(new Set())
  const seated = useRef<ReadonlySet<SeatId>>(new Set())
  const isPlaying = useRef(false)
  const lastReport = useRef<string | null>(null)
  const drawFrame = useEffectEvent(onFrame)
  const report = useEffectEvent(send)

  useEffect(() => {
    present.current = room.seats
      .filter((seat) => seat.isConnected)
      .map((seat) => seat.seatId)
    ready.current = new Set(
      room.seats.filter((seat) => seat.isReady).map((seat) => seat.seatId)
    )
    seated.current = new Set(room.seats.map((seat) => seat.seatId))
    for (const seat of room.seats) {
      if (!seat.isConnected) {
        aims.current.delete(seat.seatId)
      }
    }
    lastReport.current = null
  }, [room])

  useEffect(
    () =>
      events.subscribe((event) => {
        if (event.type === 'tower.aim') {
          aims.current.set(event.seatId, { x: event.x, z: event.z })
        } else if (event.type === 'tower.drop') {
          drops.current.add(event.seatId)
        } else if (event.type === 'tower.rule' && !isPlaying.current) {
          ruleRef.current = event.rule
          setRule(event.rule)
          lastReport.current = null
        }
      }),
    [events]
  )

  useEffect(() => {
    let rapier: Rapier | null = null
    let isGone = false
    void loadRapier().then((loaded) => {
      if (!isGone) rapier = loaded
    })

    let match: TowerMatch | null = null
    let dispose: (() => void) | null = null
    let isStartUntold = false
    let isEndUntold = false
    let pendingSeconds = 0
    let sinceReport = TOWER_STATE_REPORT_SECONDS
    let lastStandings: string | null = null
    let previousTime: number | null = null

    const startIfReady = () => {
      const players = present.current
      const isEveryoneReady =
        players.length >= TOWER_PLAYERS.fewest &&
        players.every((seat) => ready.current.has(seat))
      if (rapier === null || !isEveryoneReady) {
        return
      }
      const physics = createTowerPhysics(rapier, interior)
      match = createTowerMatch({
        interior,
        physics,
        random: Math.random,
        rule: ruleRef.current,
        seats: players.slice(0, TOWER_PLAYERS.most)
      })
      dispose = physics.dispose
      ready.current = new Set()
      isPlaying.current = true
      isStartUntold = true
    }

    let frame = requestAnimationFrame(function step(time) {
      const seconds =
        previousTime === null
          ? 0
          : Math.min((time - previousTime) / 1000, LONGEST_FRAME_SECONDS)
      previousTime = time
      pendingSeconds += seconds

      if (match === null) {
        startIfReady()
        pendingSeconds = 0
      }

      while (match !== null && pendingSeconds >= TOWER_STEP_SECONDS) {
        pendingSeconds -= TOWER_STEP_SECONDS
        const isOver = match.advance({
          aims: aims.current,
          drops: drops.current,
          present: new Set(present.current),
          seated: seated.current
        })
        drops.current = new Set()
        if (isOver) {
          match = null
          dispose?.()
          dispose = null
          isPlaying.current = false
          isEndUntold = true
          lastStandings = null
          setView(null)
        }
      }

      if (match !== null) {
        const current = match.view()
        const key = standingsKey(current)
        if (key !== lastStandings) {
          lastStandings = key
          setView(current)
        }
      }

      if (isStartUntold && report({ type: 'game.started' })) {
        isStartUntold = false
      }
      // The room goes back to its lobby: every phone shows its lobby sheet again.
      if (isEndUntold && report({ type: 'game.ended' })) {
        isEndUntold = false
      }

      sinceReport += seconds
      if (sinceReport >= TOWER_STATE_REPORT_SECONDS) {
        sinceReport = 0
        const state = reportedState({
          rule: ruleRef.current,
          view: match?.view() ?? null
        })
        const serialized = JSON.stringify(state)
        if (serialized !== lastReport.current && report(state)) {
          lastReport.current = serialized
        }
      }

      drawFrame(match, seconds)
      frame = requestAnimationFrame(step)
    })

    return () => {
      isGone = true
      cancelAnimationFrame(frame)
      dispose?.()
    }
  }, [interior])

  return { rule, view }
}
