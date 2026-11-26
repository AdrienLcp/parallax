import { useEffect, useEffectEvent, useRef, useState } from 'react'

import type { SeatId } from '@parallax/protocol/identifiers'
import type { ScreenRoomMessage } from '@parallax/protocol/server-message'

import type { EventSubscription } from '@/helpers/event-channel'
import type { RoomSocket } from '@/infrastructure/messaging/use-room-socket'

import type { ScreenGameEvent } from '../game-definition'
import {
  type ClawMatch,
  type ClawMatchView,
  type ClawStick,
  createClawMatch
} from './claw-match'
import type { ClawPit } from './claw-pit'
import { CATCH_SHOWN_SECONDS } from './claw-scene-standings'
import { reportedState } from './claw-state-report'
import {
  CLAW_PLAYERS,
  CLAW_STATE_REPORT_SECONDS,
  CLAW_STEP_SECONDS,
  LONGEST_FRAME_SECONDS
} from './claw-tuning'

type ClawSimulationInput = {
  events: EventSubscription<ScreenGameEvent>
  /** Called on every display frame with the match as it stands (`null` while the room gathers) and the wall time since the last one. */
  onFrame: (match: ClawMatch | null, seconds: number) => void
  pit: ClawPit
  room: ScreenRoomMessage
  send: RoomSocket['send']
}

/** What of a view changes the standings: the rest moves every frame. */
const standingsKey = (view: ClawMatchView): string =>
  JSON.stringify({
    catch:
      view.lastCatch !== null &&
      view.elapsed - view.lastCatch.at < CATCH_SHOWN_SECONDS
        ? view.lastCatch
        : null,
    outcome: view.outcome,
    scores: view.claws.map((claw) => [claw.seat, claw.score]),
    seconds: Math.ceil(view.elapsed)
  })

/**
 * Runs the claw on the screen: hears the phones' sticks and drops, starts a
 * game once every present player is ready and tells the room their marks are
 * spent, steps it at a fixed rate whatever the display's refresh, tells the
 * phones when the game's state changes, and tells the room when it is over.
 */
export const useClawSimulation = ({
  events,
  onFrame,
  pit,
  room,
  send
}: ClawSimulationInput): ClawMatchView | null => {
  const [view, setView] = useState<ClawMatchView | null>(null)
  const sticks = useRef(new Map<SeatId, ClawStick>())
  const drops = useRef(new Set<SeatId>())
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
      if (!seat.isConnected) sticks.current.delete(seat.seatId)
    }
    lastReport.current = null
  }, [room])

  useEffect(
    () =>
      events.subscribe((event) => {
        if (event.type === 'claw.stick') {
          sticks.current.set(event.seatId, { x: event.x, z: event.z })
        } else if (event.type === 'claw.drop') {
          drops.current.add(event.seatId)
        }
      }),
    [events]
  )

  useEffect(() => {
    let match: ClawMatch | null = null
    let isStartUntold = false
    let isEndUntold = false
    let pendingSeconds = 0
    let sinceReport = CLAW_STATE_REPORT_SECONDS
    let lastStandings: string | null = null
    let previousTime: number | null = null

    const startIfReady = () => {
      const players = present.current
      const isEveryoneReady =
        players.length >= CLAW_PLAYERS.fewest &&
        players.every((seat) => ready.current.has(seat))
      if (!isEveryoneReady) return
      match = createClawMatch({
        pit,
        random: Math.random,
        seats: players.slice(0, CLAW_PLAYERS.most)
      })
      drops.current = new Set()
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

      while (match !== null && pendingSeconds >= CLAW_STEP_SECONDS) {
        pendingSeconds -= CLAW_STEP_SECONDS
        const isOver = match.advance({
          drops: drops.current,
          seated: seated.current,
          sticks: sticks.current
        })
        drops.current = new Set()
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
          // A fresh object, so React sees the change: the match mutates its own.
          setView({
            ...current,
            claws: current.claws.map((claw) => ({ ...claw }))
          })
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
      if (sinceReport >= CLAW_STATE_REPORT_SECONDS) {
        sinceReport = 0
        const state = reportedState({ pit, view: match?.view() ?? null })
        const serialized = JSON.stringify(state)
        if (serialized !== lastReport.current && report(state)) {
          lastReport.current = serialized
        }
      }

      drawFrame(match, seconds)
      frame = requestAnimationFrame(step)
    })

    return () => cancelAnimationFrame(frame)
  }, [pit])

  return view
}
