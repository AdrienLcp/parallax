import type React from 'react'

import type { RoomCode } from '@parallax/protocol/identifiers'

import { type GameId, games } from '@/features/games/games'
import { useTranslate } from '@/presentation/i18n/i18n-provider'

import { RoomPlaque } from './room-plaque'
import { RoomQr } from './room-qr'

import './room-join.sass'

type RoomJoinProps = {
  code: RoomCode
  game: GameId
}

/** How a passer-by joins from across the room: the code to scan, the room's plaque, and the game's cues. */
export const RoomJoin: React.FC<RoomJoinProps> = ({ code, game }) => {
  const translate = useTranslate()
  const { Cues } = games[game]

  return (
    <header className='room-join'>
      <RoomQr code={code} />
      <div>
        <h1 className='join-heading'>{translate('screen.join')}</h1>
        <RoomPlaque code={code} />
      </div>
      <div className='join-cues'>
        <Cues />
      </div>
    </header>
  )
}
