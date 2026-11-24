import type React from 'react'

import { ROOM_SEAT_LIMIT, type Seat } from '@parallax/protocol/room'

import type { SceneStandings } from '@/features/games/game-definition'
import { CURRENT_GAME, games } from '@/features/games/games'
import { CheckMark } from '@/features/room/check-mark'
import { ScorePips } from '@/features/room/score-pips'
import { seatNameOf } from '@/features/room/seat-name'
import { SeatTop } from '@/features/room/seat-top'
import { useTranslate } from '@/presentation/i18n/i18n-provider'

import { BackToGames } from './back-to-games'
import { SoundSwitch } from './sound-switch'

import './seat-roster.sass'

const SLOTS = Array.from({ length: ROOM_SEAT_LIMIT }, (_, slot) => slot)

/** A name may wrap between words, so it is sized on its longest word. */
const longestWordLength = (name: string): number =>
  Math.max(...name.split(' ').map((word) => word.length))

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
  const present = seats.filter((seat) => seat.isConnected)
  const waitingCue =
    present.length < players.fewest
      ? translate('screen.players', {
          fewest: players.fewest,
          most: players.most
        })
      : translate('lobby.readyCount', {
          present: present.length,
          ready: present.filter((seat) => seat.isReady).length
        })

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
          const name = seatNameOf(seat, translate)

          return (
            <li
              className='seat-place'
              data-absent={seat.isConnected ? undefined : ''}
              data-out={standing?.isOut ? '' : undefined}
              data-ready={
                standings === null && seat.isConnected && seat.isReady
                  ? ''
                  : undefined
              }
              data-winner={standing?.isWinner ? '' : undefined}
              key={slot}
            >
              <SeatTop className='seat-place-top' slot={slot} />
              <span className='seat-label'>
                <span
                  className='seat-name'
                  style={{ '--name-length': longestWordLength(name) }}
                >
                  {name}
                </span>
                {!seat.isConnected ? (
                  <small className='seat-absence'>
                    {translate('screen.seat.absent')}
                  </small>
                ) : standings === null ? (
                  seat.isReady && (
                    <small className='seat-ready'>
                      <CheckMark />
                      {translate('lobby.ready')}
                    </small>
                  )
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
      <div className='seat-foot'>
        <p className='seat-cue'>{standings?.cue ?? waitingCue}</p>
        <SoundSwitch />
        <BackToGames />
      </div>
    </div>
  )
}
