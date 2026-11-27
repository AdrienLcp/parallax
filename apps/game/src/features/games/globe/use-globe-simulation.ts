import { useEffect, useEffectEvent, useRef, useState } from 'react'

import type { SeatId } from '@parallax/protocol/identifiers'
import type { ScreenRoomMessage } from '@parallax/protocol/server-message'

import type { EventSubscription } from '@/helpers/event-channel'
import type { RoomSocket } from '@/infrastructure/messaging/use-room-socket'

import type { ScreenGameEvent } from '../game-definition'
import type { GlobeJudge } from './globe-atlas'
import {
  createGlobeMatch,
  type GlobeMatch,
  type GlobeStick,
  type GlobeView
} from './globe-match'
import { reportedState } from './globe-state-report'
import {
  GLOBE_PLAYERS,
  GLOBE_STATE_REPORT_SECONDS,
  GLOBE_STEP_SECONDS,
  LONGEST_FRAME_SECONDS
} from './globe-tuning'

type GlobeSimulationInput = {
  events: EventSubscription<ScreenGameEvent>
  /** `null` until the atlas has loaded: no game starts without it, as nothing could be judged. */
  judge: GlobeJudge | null
  /** Called on every display frame with the match as it stands (`null` while the room gathers) and the wall time since the last one. */
  onFrame: (match: GlobeMatch | null, seconds: number) => void
  room: ScreenRoomMessage
  send: RoomSocket['send']
}

/** What of a view changes the standings: the globe itself moves every frame. */
const standingsKey = (view: GlobeView): string =>
  JSON.stringify({
    outcome: view.outcome,
    phase: view.phase,
    result: view.result?.points ?? null,
    scores: [...view.scores],
    seconds: view.turn === null ? null : Math.ceil(view.turn.secondsLeft * 4),
    turn: view.turns.played
  })

/**
 * Runs Terre on the screen: hears the holder's sticks and plant, starts a
 * game once every present player is ready (and the atlas is in) and tells
 * the room their marks are spent, steps it at a fixed rate whatever the
 * display's refresh, tells the phones when the game's state changes, and
 * tells the room when it is over.
 */
export const useGlobeSimulation = ({
  events,
  judge,
  onFrame,
  room,
  send
}: GlobeSimulationInput): GlobeView | null => {
  const [view, setView] = useState<GlobeView | null>(null)
  const sticks = useRef(new Map<SeatId, GlobeStick>())
  const zooms = useRef(new Map<SeatId, number>())
  const plants = useRef(new Set<SeatId>())
  const present = useRef<readonly SeatId[]>([])
  const ready = useRef<ReadonlySet<SeatId>>(new Set())
  const seated = useRef<ReadonlySet<SeatId>>(new Set())
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
        sticks.current.delete(seat.seatId)
        zooms.current.delete(seat.seatId)
      }
    }
    lastReport.current = null
  }, [room])

  useEffect(
    () =>
      events.subscribe((event) => {
        if (event.type === 'globe.stick') {
          sticks.current.set(event.seatId, { x: event.x, y: event.y })
        } else if (event.type === 'globe.zoom') {
          zooms.current.set(event.seatId, event.rate)
        } else if (event.type === 'globe.plant') {
          plants.current.add(event.seatId)
        }
      }),
    [events]
  )

  useEffect(() => {
    let match: GlobeMatch | null = null
    let isStartUntold = false
    let isEndUntold = false
    let pendingSeconds = 0
    let sinceReport = GLOBE_STATE_REPORT_SECONDS
    let lastStandings: string | null = null
    let previousTime: number | null = null

    const startIfReady = () => {
      if (judge === null) return
      const players = present.current
      const isEveryoneReady =
        players.length >= GLOBE_PLAYERS.fewest &&
        players.every((seat) => ready.current.has(seat))
      if (!isEveryoneReady) return
      match = createGlobeMatch({
        judge,
        random: Math.random,
        seats: players.slice(0, GLOBE_PLAYERS.most)
      })
      plants.current = new Set()
      ready.current = new Set()
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

      while (match !== null && pendingSeconds >= GLOBE_STEP_SECONDS) {
        pendingSeconds -= GLOBE_STEP_SECONDS
        const isOver = match.advance(
          {
            plants: plants.current,
            seated: seated.current,
            sticks: sticks.current,
            zooms: zooms.current
          },
          GLOBE_STEP_SECONDS
        )
        plants.current = new Set()
        if (isOver) {
          match = null
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
          // A fresh object, so React sees the change: the scores map is the match's own.
          setView({ ...current, scores: new Map(current.scores) })
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
      if (sinceReport >= GLOBE_STATE_REPORT_SECONDS) {
        sinceReport = 0
        const state = reportedState(match?.view() ?? null)
        const serialized = JSON.stringify(state)
        if (serialized !== lastReport.current && report(state)) {
          lastReport.current = serialized
        }
      }

      drawFrame(match, seconds)
      frame = requestAnimationFrame(step)
    })

    return () => cancelAnimationFrame(frame)
  }, [judge])

  return view
}
