import type React from 'react'
import { useEffect, useState } from 'react'

import type { ClawState } from '@parallax/protocol/claw'
import type { SeatId } from '@parallax/protocol/identifiers'
import type { Seat } from '@parallax/protocol/room'

import { LobbySheet } from '@/features/room/lobby-sheet'
import { seatNameOf } from '@/features/room/seat-name'
import { SeatTop } from '@/features/room/seat-top'
import type { EventSubscription } from '@/helpers/event-channel'
import { vibrate } from '@/infrastructure/browser'
import { Button } from '@/presentation/components/button'
import { useTranslate } from '@/presentation/i18n/i18n-provider'

import type { GameControllerProps, PlayerGameEvent } from '../game-definition'
import { FloatingStick } from '../sumo/floating-stick'
import { usePacedStick } from '../sumo/use-paced-stick'
import { CLAW_PLAYERS } from './claw-tuning'

import '../sumo/sumo-controller.sass'
import '../tower/tower-controller.sass'
import './claw-controller.sass'

const DROP_BUZZ_MS = 25
const CATCH_BUZZ = [30, 40, 30] as const
const OUTCOME_BUZZ = {
  lost: [60, 40, 60],
  tie: [40, 40, 40],
  won: [30, 30, 30, 30, 30, 30, 240]
} as const

/** The last `claw.state` the screen sent, or `null` until the first one arrives. */
const useClawState = (
  events: EventSubscription<PlayerGameEvent>
): ClawState | null => {
  const [state, setState] = useState<ClawState | null>(null)
  useEffect(
    () =>
      events.subscribe((event) => {
        if (event.type === 'claw.state') setState(event)
      }),
    [events]
  )
  return state
}

type PitMapProps = {
  seats: readonly Seat[]
  state: ClawState
  youId: SeatId
}

/**
 * The pit seen from above, small: the back wall at the top, a chute in each
 * front corner, a dot for each claw and the player's own larger. Only a help:
 * the aim is read on the display.
 */
const PitMap: React.FC<PitMapProps> = ({ seats, state, youId }) => {
  const translate = useTranslate()
  const toMap = (share: number) => 10 + ((share + 1) / 2) * 80
  return (
    <svg
      aria-label={translate('claw.map')}
      className='pit-map'
      role='img'
      viewBox='0 0 100 100'
    >
      <rect className='pit-floor' height='96' rx='6' width='96' x='2' y='2' />
      <rect className='pit-chute' height='16' rx='2' width='18' x='4' y='80' />
      <rect className='pit-chute' height='16' rx='2' width='18' x='78' y='80' />
      {state.seats.map((claw) => {
        const seat = seats.find((candidate) => candidate.seatId === claw.seatId)
        const isOwn = claw.seatId === youId
        return (
          <circle
            className={isOwn ? 'pit-claw own' : 'pit-claw'}
            cx={toMap(claw.x)}
            cy={toMap(claw.z)}
            data-seat-slot={seat?.slot}
            key={claw.seatId}
            r={isOwn ? 9 : 5}
          />
        )
      })}
    </svg>
  )
}

/**
 * The claw in the player's hands, on their seat's colour. In the lobby: the
 * seat. In play: the stick steers the claw (the player watches it on the
 * display), the button drops it, and a small map of the pit helps. The pad
 * rests while the claw is down.
 */
export const ClawController: React.FC<GameControllerProps> = ({
  events,
  room,
  send
}) => {
  const translate = useTranslate()
  const state = useClawState(events)
  const sendStick = usePacedStick(
    (stick) => send({ type: 'claw.stick', x: stick.x, z: stick.y }),
    room
  )
  const ownSeat = room.seats.find((seat) => seat.seatId === room.youId)
  const own = state?.seats.find((seat) => seat.seatId === room.youId)
  const isLobby =
    room.phase === 'lobby' || state === null || state.phase === 'lobby'
  const isDecided = state?.phase === 'decided'
  const canAim = !isLobby && !isDecided && own?.activity === 'aiming'
  const outcome =
    !isDecided || own === undefined
      ? null
      : !state.winners.includes(room.youId)
        ? 'lost'
        : state.winners.length > 1
          ? 'tie'
          : 'won'
  const score = own?.score ?? 0

  useEffect(() => {
    if (outcome !== null) vibrate(OUTCOME_BUZZ[outcome])
  }, [outcome])

  useEffect(() => {
    if (score > 0) vibrate(CATCH_BUZZ)
  }, [score])

  if (ownSeat === undefined) return null

  const drop = () => {
    send({ type: 'claw.drop' })
    vibrate(DROP_BUZZ_MS)
  }

  return (
    <div
      className='sumo-controller tower-controller claw-controller'
      data-seat-slot={ownSeat.slot}
      data-view={isLobby ? 'lobby' : 'pad'}
    >
      {isLobby && (
        <LobbySheet
          fewest={CLAW_PLAYERS.fewest}
          game={room.game}
          seat={ownSeat}
          seats={room.seats}
          send={send}
        />
      )}
      {!isLobby && state !== null && (
        <PitMap seats={room.seats} state={state} youId={room.youId} />
      )}
      <section className='pad' inert={!canAim}>
        <header className='seat-badge'>
          <SeatTop className='badge-top' slot={ownSeat.slot} />
          <h1 className='badge-name'>{seatNameOf(ownSeat, translate)}</h1>
          {!isLobby && (
            <span className='badge-points'>
              {translate('claw.points', { points: score })}
            </span>
          )}
        </header>
        <FloatingStick onStick={sendStick} slot={ownSeat.slot} />
        <div className='dash-side'>
          <Button className='drop-button' onPressStart={drop}>
            <svg aria-hidden='true' className='drop-arrow' viewBox='0 0 48 48'>
              <path
                d='M24 4 V18'
                fill='none'
                stroke='currentColor'
                strokeLinecap='round'
                strokeWidth='4'
              />
              <path
                d='M14 30 Q14 20 24 20 Q34 20 34 30 M14 30 L12 40 M34 30 L36 40 M24 22 V40'
                fill='none'
                stroke='currentColor'
                strokeLinecap='round'
                strokeWidth='4'
              />
            </svg>
            <span className='dash-label'>{translate('claw.drop')}</span>
          </Button>
        </div>
      </section>
      <p className='tower-status' role='status'>
        {outcome === null ? '' : translate(`claw.outcome.${outcome}`)}
      </p>
    </div>
  )
}
