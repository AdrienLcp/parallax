import type React from 'react'
import { useEffect } from 'react'

import type { Seat } from '@parallax/protocol/room'

import { LobbySheet } from '@/features/room/lobby-sheet'
import { seatNameOf } from '@/features/room/seat-name'
import { SeatTop } from '@/features/room/seat-top'
import { vibrate } from '@/infrastructure/browser'
import { useTranslate } from '@/presentation/i18n/i18n-provider'

import type { GameControllerProps } from '../game-definition'
import { DashButton } from './dash-button'
import { FloatingStick } from './floating-stick'
import { SumoBand } from './sumo-band'
import {
  type SumoControllerView,
  sumoControllerView
} from './sumo-controller-view'
import { SUMO_PLAYERS } from './sumo-tuning'
import { usePacedStick } from './use-paced-stick'
import { useSumoState } from './use-sumo-state'

import './sumo-controller.sass'

const OUTCOME_BUZZ = {
  matchWon: [30, 30, 30, 30, 30, 30, 240],
  out: [60, 40, 60],
  roundWon: [30, 30, 30, 30, 90]
} as const

const isOutcome = (
  view: SumoControllerView
): view is keyof typeof OUTCOME_BUZZ => view in OUTCOME_BUZZ

const useOutcomeBuzz = (view: SumoControllerView): void => {
  useEffect(() => {
    if (isOutcome(view)) {
      vibrate(OUTCOME_BUZZ[view])
    }
  }, [view])
}

type SeatBadgeProps = {
  seat: Seat
}

const SeatBadge: React.FC<SeatBadgeProps> = ({ seat }) => {
  const translate = useTranslate()

  return (
    <header className='seat-badge'>
      <SeatTop className='badge-top' slot={seat.slot} />
      <h1 className='badge-name'>{seatNameOf(seat, translate)}</h1>
    </header>
  )
}

/**
 * The sumo in the player's hands, on their seat's lacquer. Before a match:
 * the seat's name and the ready toggle. Once a round is on, in whichever way
 * the phone is held: the floating stick under the left thumb, the dash under
 * the right.
 */
export const SumoController: React.FC<GameControllerProps> = ({
  events,
  room,
  send
}) => {
  const state = useSumoState(events)
  const sendStick = usePacedStick(
    (stick) => send({ type: 'sumo.stick', x: stick.x, y: stick.y }),
    room
  )
  const view = sumoControllerView({ seatId: room.youId, state })

  useOutcomeBuzz(view)

  const ownSeat = room.seats.find((seat) => seat.seatId === room.youId)

  if (ownSeat === undefined) {
    return null
  }

  const dash = () => {
    send({ type: 'sumo.dash' })
  }

  const isRoundOver = isOutcome(view)
  const ownTop = state?.tops.find((top) => top.seatId === room.youId)
  const score = ownTop?.roundsWon ?? 0
  const pushedBy = room.seats.find((seat) => seat.seatId === ownTop?.outBy)

  return (
    <div
      className='sumo-controller'
      data-seat-slot={ownSeat.slot}
      data-view={view}
    >
      {view === 'lobby' && (
        <LobbySheet
          fewest={SUMO_PLAYERS.fewest}
          game={room.game}
          seat={ownSeat}
          seats={room.seats}
          send={send}
        />
      )}
      <section className='pad' inert={isRoundOver}>
        <SeatBadge seat={ownSeat} />
        <FloatingStick onStick={sendStick} slot={ownSeat.slot} />
        <div className='dash-side'>
          <DashButton onDash={dash} />
        </div>
      </section>
      <div className='round-outcome' role='status'>
        {view === 'out' && (
          <SumoBand
            outcome='out'
            pushedBy={pushedBy}
            score={score}
            slot={ownSeat.slot}
          />
        )}
        {(view === 'roundWon' || view === 'matchWon') && (
          <SumoBand outcome={view} score={score} slot={ownSeat.slot} />
        )}
      </div>
    </div>
  )
}
