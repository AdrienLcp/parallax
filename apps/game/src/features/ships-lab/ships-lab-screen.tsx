import type React from 'react'
import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router'

import type { CreateRoomResponse } from '@parallax/protocol/http'
import type { SeatSlot } from '@parallax/protocol/room'
import { screenEventSchema } from '@parallax/protocol/server-message'

import { alcoveInterior } from '@/features/alcove/alcove-bounds'
import { SHIPPED_ALCOVE } from '@/features/alcove/shipped-alcove'
import { RoomQr } from '@/features/screen/room-qr'
import { openRoom } from '@/infrastructure/api/rooms-api'
import { reloadPage } from '@/infrastructure/browser'
import { useRoomSocket } from '@/infrastructure/messaging/use-room-socket'
import { Main } from '@/presentation/components/main'
import { useTranslate } from '@/presentation/i18n/i18n-provider'

import {
  advanceFlight,
  createFlightWorld,
  type FlightMode,
  type FlightPad,
  IDLE_PAD
} from './ships-lab-flight'
import {
  labPadPathFor,
  labScreenPathFor,
  UNIT_PARAM,
  useFlightModeParam
} from './ships-lab-mode'
import { createShipsLabRenderer } from './ships-lab-renderer'

import './ships-lab-screen.sass'

const INTERIOR = alcoveInterior(SHIPPED_ALCOVE)
/** The counters on screen change at this pace, not every frame. */
const SCORE_REFRESH_MS = 200

type Score = { hits: number; shots: number }

type FlightViewProps = {
  isOnUnit: boolean
  mode: FlightMode
  room: CreateRoomResponse
}

/** One ship in the alcove, flown by the one phone that scanned the code. */
const FlightView: React.FC<FlightViewProps> = ({ isOnUnit, mode, room }) => {
  const translate = useTranslate()
  const host = useRef<HTMLDivElement>(null)
  const padRef = useRef<FlightPad>(IDLE_PAD)
  const slotRef = useRef<SeatSlot | null>(null)
  const [pilotCount, setPilotCount] = useState(0)
  const [score, setScore] = useState<Score>({ hits: 0, shots: 0 })

  const socket = useRoomSocket({
    credentials: { role: 'screen', screenToken: room.screenToken },
    eventSchema: screenEventSchema,
    onEvent: (event) => {
      if (event.type === 'room.updated') {
        const present = event.seats.filter((seat) => seat.isConnected)
        setPilotCount(present.length)
        slotRef.current = present[0]?.slot ?? null
        if (present.length === 0) padRef.current = IDLE_PAD
        return
      }
      if (event.type === 'ships.pad') padRef.current = event
    },
    roomCode: room.code
  })

  useEffect(() => {
    if (host.current === null) return
    const renderer = createShipsLabRenderer(host.current, { isOnUnit })
    const world = createFlightWorld(mode, INTERIOR)
    let frame = 0
    let last: number | null = null
    let lastScoreAt = 0
    const tick = (now: number) => {
      const seconds = now / 1000
      if (last !== null) advanceFlight(world, padRef.current, seconds - last)
      last = seconds
      renderer.draw(world, slotRef.current, seconds)
      if (now - lastScoreAt > SCORE_REFRESH_MS) {
        lastScoreAt = now
        setScore((shown) =>
          shown.hits === world.hits && shown.shots === world.shots
            ? shown
            : { hits: world.hits, shots: world.shots }
        )
      }
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(frame)
      renderer.dispose()
    }
  }, [isOnUnit, mode])

  const otherMode: FlightMode = mode === 'screen' ? 'pilot' : 'screen'

  return (
    <div className='lab-flight' ref={host}>
      <aside className='lab-panel'>
        <h1 className='lab-title'>{translate(`shipsLab.mode.${mode}`)}</h1>
        <div className='lab-qr'>
          <RoomQr code={room.code} path={labPadPathFor(mode, room.code)} />
        </div>
        <p className='lab-status' role='status'>
          {socket.status.kind !== 'open'
            ? translate('shipsLab.connecting')
            : pilotCount === 0
              ? translate('shipsLab.scan')
              : translate('shipsLab.score', {
                  hits: String(score.hits),
                  shots: String(score.shots)
                })}
        </p>
        <Link className='lab-other' to={labScreenPathFor(otherMode)}>
          {translate(`shipsLab.mode.${otherMode}`)}
        </Link>
      </aside>
    </div>
  )
}

type RoomState =
  | { kind: 'opening' }
  | { kind: 'open'; room: CreateRoomResponse }
  | { kind: 'failed' }

/**
 * A hidden screen of the ships' lab: a room of its own, its code to scan, and
 * one ship in the alcove flown the way the address names. The alcove is drawn
 * for an ordinary monitor; `?unit` leaves it to the unit's optics.
 */
export const ShipsLabScreen: React.FC = () => {
  const translate = useTranslate()
  const mode = useFlightModeParam()
  const [params] = useSearchParams()
  const isOnUnit = params.has(UNIT_PARAM)
  const [state, setState] = useState<RoomState>({ kind: 'opening' })

  useEffect(() => {
    // A fresh room on every load, never the display's own.
    const request = new AbortController()
    void openRoom('sumo', request.signal).then((opened) => {
      if (opened.status === 'success') {
        setState({ kind: 'open', room: opened.data })
      } else if (opened.error !== 'aborted') {
        setState({ kind: 'failed' })
      }
    })
    return () => request.abort()
  }, [])

  return (
    <Main className='ships-lab-screen'>
      {mode === null ? (
        <p className='lab-notice'>{translate('shipsLab.unknownMode')}</p>
      ) : state.kind === 'open' ? (
        <FlightView
          isOnUnit={isOnUnit}
          key={`${mode}-${state.room.code}`}
          mode={mode}
          room={state.room}
        />
      ) : state.kind === 'failed' ? (
        <button className='lab-notice' onClick={reloadPage} type='button'>
          {translate('shipsLab.retry')}
        </button>
      ) : (
        <p className='lab-notice' role='status'>
          {translate('shipsLab.opening')}
        </p>
      )}
    </Main>
  )
}
