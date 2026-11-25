import type React from 'react'
import { useEffect, useState } from 'react'

import {
  type TowerRule,
  type TowerState,
  towerRuleSchema
} from '@parallax/protocol/tower'

import { LobbySheet } from '@/features/room/lobby-sheet'
import { seatNameOf } from '@/features/room/seat-name'
import { SeatTop } from '@/features/room/seat-top'
import type { EventSubscription } from '@/helpers/event-channel'
import { vibrate } from '@/infrastructure/browser'
import type { RoomSocket } from '@/infrastructure/messaging/use-room-socket'
import { Button } from '@/presentation/components/button'
import { useTranslate } from '@/presentation/i18n/i18n-provider'

import type { GameControllerProps, PlayerGameEvent } from '../game-definition'
import { FloatingStick } from '../sumo/floating-stick'
import { usePacedStick } from '../sumo/use-paced-stick'
import { TOWER_PLAYERS } from './tower-tuning'

import '../sumo/sumo-controller.sass'
import './tower-controller.sass'

const DROP_BUZZ_MS = 25
const OUTCOME_BUZZ = {
  lost: [60, 40, 60],
  won: [30, 30, 30, 30, 30, 30, 240]
} as const

/** The last `tower.state` the screen sent, or `null` until the first one arrives. */
const useTowerState = (
  events: EventSubscription<PlayerGameEvent>
): TowerState | null => {
  const [state, setState] = useState<TowerState | null>(null)
  useEffect(
    () =>
      events.subscribe((event) => {
        if (event.type === 'tower.state') setState(event)
      }),
    [events]
  )
  return state
}

type RuleChoiceProps = {
  rule: TowerRule
  send: RoomSocket['send']
}

/** The two ways to play, any seated player picks one; the screen keeps it. */
const RuleChoice: React.FC<RuleChoiceProps> = ({ rule, send }) => {
  const translate = useTranslate()
  return (
    <fieldset className='lobby-games tower-rules'>
      <legend className='lobby-games-label'>
        {translate('tower.rule.label')}
      </legend>
      {towerRuleSchema.options.map((option) => (
        <label className='lobby-game' key={option}>
          <input
            checked={option === rule}
            name='tower-rule'
            onChange={() => send({ rule: option, type: 'tower.rule' })}
            type='radio'
            value={option}
          />
          {translate(`tower.rule.${option}`)}
        </label>
      ))}
    </fieldset>
  )
}

/**
 * The tower in the player's hands, on their seat's colour. In the lobby: the
 * seat and the rule. While they hold the floating block: the stick moves it
 * across and in depth, the button drops it. Otherwise the pad rests and names
 * whose turn it is.
 */
export const TowerController: React.FC<GameControllerProps> = ({
  events,
  room,
  send
}) => {
  const translate = useTranslate()
  const state = useTowerState(events)
  const sendAim = usePacedStick(
    (stick) => send({ type: 'tower.aim', x: stick.x, z: stick.y }),
    room
  )
  const ownSeat = room.seats.find((seat) => seat.seatId === room.youId)
  const own = state?.seats.find((seat) => seat.seatId === room.youId)
  const isLobby =
    room.phase === 'lobby' || state === null || state.phase === 'lobby'
  const isDecided = state?.phase === 'decided'
  const holds =
    !isLobby &&
    !isDecided &&
    own?.nextBlock != null &&
    (state.rule === 'race' || state.turnSeatId === room.youId)
  const hasWon =
    isDecided && own !== undefined && !own.toppled && state.rule === 'shared'
  const outcome =
    !isDecided || own === undefined
      ? null
      : own.toppled && state.rule === 'shared'
        ? 'lost'
        : hasWon
          ? 'won'
          : null

  useEffect(() => {
    if (outcome !== null) vibrate(OUTCOME_BUZZ[outcome])
  }, [outcome])

  if (ownSeat === undefined) return null

  const turnSeat = room.seats.find((seat) => seat.seatId === state?.turnSeatId)
  const drop = () => {
    send({ type: 'tower.drop' })
    vibrate(DROP_BUZZ_MS)
  }

  return (
    <div
      className='sumo-controller tower-controller'
      data-seat-slot={ownSeat.slot}
      data-view={isLobby ? 'lobby' : 'pad'}
    >
      {isLobby && (
        <LobbySheet
          fewest={TOWER_PLAYERS.fewest}
          game={room.game}
          seat={ownSeat}
          seats={room.seats}
          send={send}
        >
          <RuleChoice rule={state?.rule ?? 'shared'} send={send} />
        </LobbySheet>
      )}
      <section className='pad' inert={!holds}>
        <header className='seat-badge'>
          <SeatTop className='badge-top' slot={ownSeat.slot} />
          <h1 className='badge-name'>{seatNameOf(ownSeat, translate)}</h1>
        </header>
        <FloatingStick onStick={sendAim} slot={ownSeat.slot} />
        <div className='dash-side'>
          <Button className='drop-button' onPressStart={drop}>
            <svg aria-hidden='true' className='drop-arrow' viewBox='0 0 48 48'>
              <rect
                fill='currentColor'
                height='12'
                rx='2'
                width='28'
                x='10'
                y='6'
              />
              <path
                d='M24 22 V40 M16 32 L24 40 L32 32'
                fill='none'
                stroke='currentColor'
                strokeLinecap='round'
                strokeWidth='4'
              />
            </svg>
            <span className='dash-label'>{translate('tower.drop')}</span>
          </Button>
        </div>
      </section>
      <p className='tower-status' role='status'>
        {outcome !== null
          ? translate(`tower.outcome.${outcome}`)
          : !isLobby &&
              !holds &&
              turnSeat !== undefined &&
              state?.rule === 'shared'
            ? translate('tower.turn.theirs', {
                seat: seatNameOf(turnSeat, translate)
              })
            : ''}
      </p>
    </div>
  )
}
