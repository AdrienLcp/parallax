import type React from 'react'

import type { RoomCode } from '@parallax/protocol/identifiers'

import { useTranslate } from '@/presentation/i18n/i18n-provider'

import { RoomPlaque } from './room-plaque'
import { RoomQr } from './room-qr'

import './play-header.sass'

type PlayHeaderProps = {
  code: RoomCode
  subtitle: string
  title: string
}

/** The display's header while a game runs: where the game stands, and a small code for late joiners. */
export const PlayHeader: React.FC<PlayHeaderProps> = ({
  code,
  subtitle,
  title
}) => {
  const translate = useTranslate()

  return (
    <header className='play-header'>
      <div>
        <h1 className='play-title'>{title}</h1>
        <p className='play-subtitle'>{subtitle}</p>
      </div>
      <div className='late-join'>
        <div className='late-join-label'>
          <RoomPlaque code={code} isCompact />
          <span>{translate('screen.nextRound')}</span>
        </div>
        <RoomQr code={code} />
      </div>
    </header>
  )
}
