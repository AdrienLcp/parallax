import { useEffect, useEffectEvent, useRef, useState } from 'react'

import type { SeatId } from '@parallax/protocol/identifiers'
import type { ScreenRoomMessage } from '@parallax/protocol/server-message'

import type { EventSubscription } from '@/helpers/event-channel'
import type { RoomSocket } from '@/infrastructure/messaging/use-room-socket'

import type { ScreenGameEvent } from '../game-definition'
import {
  advanceMatch,
  ejectedBetween,
  GATHERING,
  type SumoMatch
} from './sumo-match'
import type { SumoControl } from './sumo-physics'
import {
  agedEjection,
  type ShownEjection,
  type SumoStandings,
  standingsOf,
  withEjected
} from './sumo-standings'
import { reportedState } from './sumo-state-report'
import { SUMO_STATE_REPORT_SECONDS, SUMO_STEP_SECONDS } from './sumo-tuning'

/** A frame later than this, after a hidden tab or a stall, is not caught up: the game pauses instead. */
const LONGEST_FRAME_SECONDS = 0.25

type SumoSimulationInput = {
  events: EventSubscription<ScreenGameEvent>
  /** Called on every display frame with the match as it stands and the wall time since the last one. */
  onFrame: (match: SumoMatch, seconds: number) => void
  room: ScreenRoomMessage
  send: RoomSocket['send']
}

/**
 * Runs the sumo on the screen: hears the phones' sticks and dashes, steps the
 * match at a fixed rate whatever the display's refresh, tells the phones when
 * its state changes, and keeps the standings the room reads around the arena.
 */
export const useSumoSimulation = ({
  events,
  onFrame,
  room,
  send
}: SumoSimulationInput): SumoStandings | null => {
  const [standings, setStandings] = useState<SumoStandings | null>(null)
  const controls = useRef(new Map<SeatId, SumoControl>())
  const dashes = useRef(new Set<SeatId>())
  const present = useRef<readonly SeatId[]>([])
  const seated = useRef<ReadonlySet<SeatId>>(new Set())
  const lastReport = useRef<string | null>(null)
  const drawFrame = useEffectEvent(onFrame)
  const report = useEffectEvent(send)

  useEffect(() => {
    present.current = room.seats
      .filter((seat) => seat.isConnected)
      .map((seat) => seat.seatId)
    seated.current = new Set(room.seats.map((seat) => seat.seatId))
    for (const seat of room.seats) {
      if (!seat.isConnected) {
        controls.current.delete(seat.seatId)
      }
    }
    lastReport.current = null
  }, [room])

  useEffect(
    () =>
      events.subscribe((event) => {
        if (event.type === 'sumo.stick') {
          controls.current.set(event.seatId, {
            stick: { x: event.x, y: event.y }
          })
        } else if (event.type === 'sumo.dash') {
          dashes.current.add(event.seatId)
        }
      }),
    [events]
  )

  useEffect(() => {
    let match: SumoMatch = GATHERING
    let pendingSeconds = 0
    let sinceReport = SUMO_STATE_REPORT_SECONDS
    let ejection: ShownEjection | null = null
    let lastStandings: string | null = null
    let previousTime: number | null = null
    let frame = requestAnimationFrame(function step(time) {
      const seconds =
        previousTime === null
          ? 0
          : Math.min((time - previousTime) / 1000, LONGEST_FRAME_SECONDS)
      previousTime = time
      pendingSeconds += seconds

      while (pendingSeconds >= SUMO_STEP_SECONDS) {
        pendingSeconds -= SUMO_STEP_SECONDS
        const previous = match
        match = advanceMatch(match, {
          controls: controls.current,
          dashes: dashes.current,
          present: present.current,
          seated: seated.current,
          seconds: SUMO_STEP_SECONDS
        })
        dashes.current = new Set()
        ejection = withEjected({
          ejected: ejectedBetween({ next: match, previous }),
          shown: agedEjection({ seconds: SUMO_STEP_SECONDS, shown: ejection })
        })
      }

      const nextStandings = standingsOf({ ejection, match })
      const serializedStandings = JSON.stringify(nextStandings)
      if (serializedStandings !== lastStandings) {
        lastStandings = serializedStandings
        setStandings(nextStandings)
      }

      sinceReport += seconds
      if (sinceReport >= SUMO_STATE_REPORT_SECONDS) {
        sinceReport = 0
        const state = reportedState(match)
        const serialized = JSON.stringify(state)
        if (serialized !== lastReport.current && report(state)) {
          lastReport.current = serialized
        }
      }

      drawFrame(match, seconds)
      frame = requestAnimationFrame(step)
    })

    return () => cancelAnimationFrame(frame)
  }, [])

  return standings
}
