import type React from 'react'

import { ROOM_SEAT_LIMIT, type Seat } from '@parallax/protocol/room'

import type { SceneStandings } from '@/features/games/game-definition'
import { CURRENT_GAME, games } from '@/features/games/games'
import { seatNameKey } from '@/features/room/seat-name'
import { SeatTop } from '@/features/room/seat-top'
import { useTranslate } from '@/presentation/i18n/i18n-provider'

import './seat-roster.sass'

const SLOTS = Array.from({ length: ROOM_SEAT_LIMIT }, (_, slot) => slot)

type ScorePipsProps = {
  goal: number
  score: number
}

/** One brass ring per round the match needs, filled for each round won. */
const ScorePips: React.FC<ScorePipsProps> = ({ goal, score }) => {
  const translate = useTranslate()

  return (
    <span
      aria-label={translate('screen.seat.score', { goal, score })}
      className='score-pips'
      role='img'
    >
      {Array.from({ length: goal }, (_, pip) => pip + 1).map((round) => (
        <span
          className='score-pip'
          data-won={round <= score ? '' : undefined}
          key={round}
        />
      ))}
    </span>
  )
}

type SeatRosterProps = {
  /** The seats taken; a slot no seat holds shows as free. */
  seats: readonly Seat[]
  /** While a game runs: each playing seat's score, who fell, who won. */
  standings: SceneStandings | null
}

/**
 * The room's places on a slate framed in walnut: who sits, who is away, what
 * is free and, while a game runs, the scoreboard.
 */
export const SeatRoster: React.FC<SeatRosterProps> = ({ seats, standings }) => {
  const translate = useTranslate()
  const { players } = games[CURRENT_GAME]

  return (
    <div className='seat-roster'>
      <ul className='seat-places'>
        {SLOTS.map((slot) => {
          const seat = seats.find((candidate) => candidate.slot === slot)

          if (seat === undefined) {
            return (
              <li className='seat-place free' key={slot}>
                <svg
                  aria-hidden='true'
                  className='seat-socket'
                  viewBox='0 0 100 100'
                >
                  <circle cx='50' cy='50' r='46' />
                </svg>
                <span className='seat-label'>
                  {translate('screen.seat.free')}
                </span>
              </li>
            )
          }

          const standing = standings?.seats.get(seat.seatId)

          return (
            <li
              className='seat-place'
              data-absent={seat.isConnected ? undefined : ''}
              data-out={standing?.isOut ? '' : undefined}
              data-winner={standing?.isWinner ? '' : undefined}
              key={slot}
            >
              <SeatTop className='seat-place-top' slot={slot} />
              <span className='seat-label'>
                <span className='seat-name'>
                  {translate(seatNameKey(slot))}
                </span>
                {!seat.isConnected ? (
                  <small className='seat-absence'>
                    {translate('screen.seat.absent')}
                  </small>
                ) : (
                  standing !== undefined &&
                  standings !== null && (
                    <ScorePips goal={standings.goal} score={standing.score} />
                  )
                )}
              </span>
            </li>
          )
        })}
      </ul>
      <p className='seat-cue'>
        {standings?.cue ??
          translate('screen.players', {
            fewest: players.fewest,
            most: players.most
          })}
      </p>
    </div>
  )
}
