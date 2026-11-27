import type React from 'react'

import type { RoomCode } from '@parallax/protocol/identifiers'
import type { Seat } from '@parallax/protocol/room'

import type { SceneStandings } from '@/features/games/game-definition'
import { type GameId, games } from '@/features/games/games'
import { SeatTop } from '@/features/room/seat-top'
import { useTranslate } from '@/presentation/i18n/i18n-provider'

import { WALL_STYLE } from './back-wall'
import { RoomPlaque } from './room-plaque'
import { RoomQr } from './room-qr'

import './room-wall.sass'

type RoomWallProps = {
  code: RoomCode
  game: GameId
  /** The seats taken, for the count the room waits on. */
  seats: readonly Seat[]
  /** While a game runs: where it stands; `null` while the room waits. */
  standings: SceneStandings | null
}

/**
 * The room's lettering on the alcove's back wall, behind the game's scene: the
 * QR card hung at the top left, the title and the room's plaque painted at the
 * top right, and one line of cues just over the seats' shelf. While a game
 * runs the title is where it stands, and the card stays up for late joiners:
 * the display takes no touch, so nothing on it waits for one.
 */
export const RoomWall: React.FC<RoomWallProps> = ({
  code,
  game,
  seats,
  standings
}) => {
  const translate = useTranslate()
  const { Cues, players } = games[game]
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
    <header className='screen-head room-wall'>
      <figure className='wall-piece wall-qr' style={WALL_STYLE.qr}>
        <RoomQr code={code} />
        {standings !== null && (
          <figcaption className='wall-qr-caption'>
            {translate('screen.lateJoin')}
          </figcaption>
        )}
      </figure>
      <div className='wall-piece wall-title' style={WALL_STYLE.title}>
        <h1 className='wall-heading'>
          {standings?.titleSlot !== undefined && (
            <span
              className='wall-turn'
              data-clock={standings.countdown === undefined ? undefined : ''}
              style={{ '--left': standings.countdown ?? 1 }}
            >
              <SeatTop className='wall-turn-top' slot={standings.titleSlot} />
            </span>
          )}
          {standings === null ? translate('screen.join') : standings.title}
        </h1>
        <RoomPlaque code={code} />
        {standings === null && <p className='wall-waiting'>{waitingCue}</p>}
      </div>
      <div className='wall-piece wall-cues' style={WALL_STYLE.cues}>
        {standings === null ? (
          <Cues />
        ) : (
          <p className='wall-subtitle'>
            {standings.subtitle} · {standings.cue}
          </p>
        )}
      </div>
    </header>
  )
}
