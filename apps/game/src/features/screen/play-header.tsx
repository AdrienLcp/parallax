import type React from 'react'

import type { RoomCode } from '@parallax/protocol/identifiers'
import type { SeatSlot } from '@parallax/protocol/room'

import { SeatTop } from '@/features/room/seat-top'

import { RoomPlaque } from './room-plaque'
import { RoomQr } from './room-qr'

import './play-header.sass'

type PlayHeaderProps = {
  code: RoomCode
  /** The share of a turn's time left, from 1 to 0: a ring empties around the title's seat. */
  countdown?: number | undefined
  subtitle: string
  title: string
  /** The seat the title names. */
  titleSlot?: SeatSlot | undefined
}

/**
 * The display's header while a game runs: where the game stands, whose turn
 * and how long it has left when the game keeps a clock and, for late joiners,
 * the room's plaque beside its QR, always shown since the display takes no
 * touch.
 */
export const PlayHeader: React.FC<PlayHeaderProps> = ({
  code,
  countdown,
  subtitle,
  title,
  titleSlot
}) => (
  <header className='play-header'>
    <div className='play-standing'>
      <h1 className='play-title'>
        {titleSlot !== undefined && (
          <span
            className='play-turn'
            data-clock={countdown === undefined ? undefined : ''}
            style={{ '--left': countdown ?? 1 }}
          >
            <SeatTop className='play-turn-top' slot={titleSlot} />
          </span>
        )}
        {title}
      </h1>
      <p className='play-subtitle'>{subtitle}</p>
    </div>
    <div className='late-join'>
      <RoomPlaque code={code} isCompact />
      <RoomQr code={code} />
    </div>
  </header>
)
