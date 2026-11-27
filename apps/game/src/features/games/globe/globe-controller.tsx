import type React from 'react'
import { useEffect, useState } from 'react'

import type { GlobeState } from '@parallax/protocol/globe'

import { useUpright } from '@/features/play/use-upright'
import { LobbySheet } from '@/features/room/lobby-sheet'
import { seatNameOf } from '@/features/room/seat-name'
import { SeatTop } from '@/features/room/seat-top'
import type { EventSubscription } from '@/helpers/event-channel'
import { vibrate } from '@/infrastructure/browser'
import { Button } from '@/presentation/components/button'
import { useI18n } from '@/presentation/i18n/i18n-context'

import type { GameControllerProps, PlayerGameEvent } from '../game-definition'
import { FloatingStick } from '../sumo/floating-stick'
import { usePacedStick } from '../sumo/use-paced-stick'
import { placeById } from './globe-places'
import { GLOBE_PLAYERS, GLOBE_TUNING } from './globe-tuning'

import '../sumo/sumo-controller.sass'
import '../tower/tower-controller.sass'
import './globe-controller.sass'

const PLANT_BUZZ_MS = 25
const OUTCOME_BUZZ = {
  lost: [60, 40, 60],
  won: [30, 30, 30, 30, 30, 30, 240]
} as const

/** The last `globe.state` the screen sent, or `null` until the first one arrives. */
const useGlobeState = (
  events: EventSubscription<PlayerGameEvent>
): GlobeState | null => {
  const [state, setState] = useState<GlobeState | null>(null)
  useEffect(
    () =>
      events.subscribe((event) => {
        if (event.type === 'globe.state') setState(event)
      }),
    [events]
  )
  return state
}

/**
 * Terre in the player's hands, on their seat's colour. While they hold the
 * globe, laid out like the tower's pad: the place asked at the top, the left
 * stick to push the crosshair over the ground, the right one to open the
 * loupe (up) and close it (down), and the button to plant, ringed by the
 * time left. Otherwise the pad rests and names who looks for what.
 */
export const GlobeController: React.FC<GameControllerProps> = ({
  events,
  room,
  send
}) => {
  const { locale, translate } = useI18n()
  const state = useGlobeState(events)
  const isUpright = useUpright()
  // The stick's `y` grows towards the player: north is away from them.
  const sendStick = usePacedStick(
    (stick) => send({ type: 'globe.stick', x: stick.x, y: -stick.y }),
    room
  )
  const sendZoom = usePacedStick(
    (stick) => send({ rate: -stick.y, type: 'globe.zoom' }),
    room
  )
  const ownSeat = room.seats.find((seat) => seat.seatId === room.youId)
  const own = state?.seats.find((seat) => seat.seatId === room.youId)
  const isLobby =
    room.phase === 'lobby' || state === null || state.phase === 'lobby'
  const isDecided = state?.phase === 'decided'
  const holds =
    !isLobby && state?.phase === 'aiming' && state.turnSeatId === room.youId
  const outcome =
    !isDecided || own === undefined ? null : own.won ? 'won' : 'lost'

  useEffect(() => {
    if (outcome !== null) vibrate(OUTCOME_BUZZ[outcome])
  }, [outcome])

  if (ownSeat === undefined) return null

  const place = state?.place == null ? undefined : placeById(state.place.id)
  const placeName = place?.names[locale] ?? ''
  const turnSeat = room.seats.find((seat) => seat.seatId === state?.turnSeatId)
  const plant = () => {
    send({ type: 'globe.plant' })
    vibrate(PLANT_BUZZ_MS)
  }
  const left =
    state?.secondsLeft == null
      ? 1
      : state.secondsLeft / GLOBE_TUNING.turnSeconds

  const status = (() => {
    if (outcome !== null) return translate(`globe.outcome.${outcome}`)
    if (isLobby || holds || turnSeat === undefined || placeName === '') {
      return ''
    }
    return translate('globe.turn.theirs', {
      place: placeName,
      seat: seatNameOf(turnSeat, translate)
    })
  })()

  return (
    <div
      className='sumo-controller tower-controller globe-controller'
      data-seat-slot={ownSeat.slot}
      data-turned={(!isLobby && isUpright) || undefined}
      data-view={isLobby ? 'lobby' : 'pad'}
    >
      {isLobby && (
        <LobbySheet
          fewest={GLOBE_PLAYERS.fewest}
          game={room.game}
          seat={ownSeat}
          seats={room.seats}
          send={send}
        />
      )}
      <section className='pad' inert={!holds}>
        <header className='seat-badge'>
          <SeatTop className='badge-top' slot={ownSeat.slot} />
          <h1 className='badge-name'>{seatNameOf(ownSeat, translate)}</h1>
          {own !== undefined && (
            <span className='badge-score'>
              {translate('globe.points', { points: own.score })}
            </span>
          )}
        </header>
        {holds && place !== undefined && (
          <p className='globe-asked'>
            <span className='globe-kind'>
              {translate(`globe.kind.${place.kind}`)}
            </span>
            <span className='globe-place'>{placeName}</span>
          </p>
        )}
        <FloatingStick onStick={sendStick} slot={ownSeat.slot} />
        <div className='spin-side'>
          <LoupeGlyph />
          <FloatingStick onStick={sendZoom} slot={ownSeat.slot} />
          <Button
            className='drop-button'
            onPressStart={plant}
            style={{ '--left': left }}
          >
            <svg aria-hidden='true' className='drop-arrow' viewBox='0 0 48 48'>
              <circle cx='24' cy='14' fill='currentColor' r='8' />
              <path
                d='M24 22 V42'
                fill='none'
                stroke='currentColor'
                strokeLinecap='round'
                strokeWidth='4'
              />
            </svg>
            <span className='dash-label'>{translate('globe.plant')}</span>
          </Button>
        </div>
      </section>
      <p className='tower-status' role='status'>
        {status}
      </p>
    </div>
  )
}

/** A plus above and a minus below the second stick's resting place: it opens and closes the loupe. */
const LoupeGlyph: React.FC = () => (
  <svg
    aria-hidden='true'
    className='rotate-arrows'
    fill='none'
    stroke='currentColor'
    strokeLinecap='round'
    strokeWidth='4'
    viewBox='0 0 100 100'
  >
    <path d='M50 6 V22 M42 14 H58' />
    <path d='M42 86 H58' />
  </svg>
)
