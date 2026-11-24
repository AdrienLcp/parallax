import type React from 'react'

import type { RoomCode } from '@parallax/protocol/identifiers'

import { RoomPlaque } from './room-plaque'
import { RoomQr } from './room-qr'

import './play-header.sass'

type PlayHeaderProps = {
  code: RoomCode
  subtitle: string
  title: string
}

/**
 * The display's header while a game runs: where the game stands and, for late
 * joiners, the room's plaque beside its QR, always shown since the display
 * takes no touch.
 */
export const PlayHeader: React.FC<PlayHeaderProps> = ({
  code,
  subtitle,
  title
}) => (
  <header className='play-header'>
    <div>
      <h1 className='play-title'>{title}</h1>
      <p className='play-subtitle'>{subtitle}</p>
    </div>
    <div className='late-join'>
      <RoomPlaque code={code} isCompact />
      <RoomQr code={code} />
    </div>
  </header>
)
