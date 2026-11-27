import type React from 'react'

import type { SeatId } from '@parallax/protocol/identifiers'
import { ROOM_SEAT_LIMIT, type Seat } from '@parallax/protocol/room'

import { FullscreenSwitch } from '@/features/fullscreen/fullscreen-switch'
import type { SceneStandings } from '@/features/games/game-definition'
import { CheckMark } from '@/features/room/check-mark'
import { ScorePips } from '@/features/room/score-pips'
import { seatNameOf } from '@/features/room/seat-name'
import { SeatTop } from '@/features/room/seat-top'
import { useTranslate } from '@/presentation/i18n/i18n-provider'

import { BackToGames } from './back-to-games'
import { PLAQUE_STYLES, SHELF_SHADOW_STYLE } from './back-wall'
import { KickSeat } from './kick-seat'
import { SoundSwitch } from './sound-switch'

import './seat-roster.sass'

const SLOTS = Array.from({ length: ROOM_SEAT_LIMIT }, (_, slot) => slot)

/** A name may wrap between words, so it is sized on its longest word. */
const longestWordLength = (name: string): number =>
  Math.max(...name.split(' ').map((word) => word.length))

type SeatRosterProps = {
  /** A game runs: the hold control stops it rather than leaving for the game choice. */
  isPlaying: boolean
  /** The mouse at the display removes a seat from the room. */
  onKick: (seatId: SeatId) => void
  /** Leaves the room's lobby for the game choice, the room kept. */
  onLeave: () => void
  /** Stops the running game: the room is back in its lobby. */
  onStop: () => void
  /** The seats taken; a slot no seat holds shows as free. */
  seats: readonly Seat[]
  /** While a game runs: each playing seat's score, who fell, who won. */
  standings: SceneStandings | null
}

/**
 * The room's places, one plaque each standing on the shelf of the alcove's
 * back wall: who sits, who is away, what is free and, while a game runs, the
 * scoreboard. The room's controls stay flat at the glass, bottom right.
 */
export const SeatRoster: React.FC<SeatRosterProps> = ({
  isPlaying,
  onKick,
  onLeave,
  onStop,
  seats,
  standings
}) => {
  const translate = useTranslate()

  return (
    <div className='seat-roster'>
      <span className='shelf-shadow' style={SHELF_SHADOW_STYLE} />
      <ul className='seat-places'>
        {SLOTS.map((slot) => {
          const seat = seats.find((candidate) => candidate.slot === slot)

          if (seat === undefined) {
            return (
              <li
                className='seat-place free'
                key={slot}
                style={PLAQUE_STYLES[slot]}
              >
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
              style={PLAQUE_STYLES[slot]}
            >
              <SeatTop className='seat-place-top' slot={slot} />
              <KickSeat name={name} onKick={() => onKick(seat.seatId)} />
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
                  standings !== null &&
                  (standing.points === undefined ? (
                    <ScorePips goal={standings.goal} score={standing.score} />
                  ) : (
                    <small className='seat-points'>{standing.points}</small>
                  ))
                )}
              </span>
            </li>
          )
        })}
      </ul>
      <div className='seat-controls'>
        <SoundSwitch />
        <FullscreenSwitch />
        <BackToGames isPlaying={isPlaying} onLeave={onLeave} onStop={onStop} />
      </div>
    </div>
  )
}
