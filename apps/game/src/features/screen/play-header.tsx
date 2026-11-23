import type React from 'react'

import type { RoomCode } from '@parallax/protocol/identifiers'

import { useTranslate } from '@/presentation/i18n/i18n-provider'

import { RoomPlaque } from './room-plaque'
import { RoomQr } from './room-qr'
import { QR_REVEAL_SECONDS, useQrReveal } from './use-qr-reveal'

import './play-header.sass'

type PlayHeaderProps = {
  code: RoomCode
  subtitle: string
  title: string
}

/**
 * The display's header while a game runs: where the game stands and, for late
 * joiners, the room's plaque with a cue to touch the display, which opens the
 * QR for a while as the header's brass rule drains.
 */
export const PlayHeader: React.FC<PlayHeaderProps> = ({
  code,
  subtitle,
  title
}) => {
  const translate = useTranslate()
  const revealTouchCount = useQrReveal()
  const isRevealed = revealTouchCount !== null

  return (
    <header
      className='play-header'
      data-revealed={isRevealed ? '' : undefined}
      style={{ '--qr-reveal-duration': `${QR_REVEAL_SECONDS}s` }}
    >
      <div>
        <h1 className='play-title'>{title}</h1>
        <p className='play-subtitle'>{subtitle}</p>
      </div>
      <div className='late-join'>
        {isRevealed ? (
          <div className='late-join-qr'>
            <RoomQr code={code} />
          </div>
        ) : (
          <>
            <RoomPlaque code={code} isCompact />
            <p className='tap-cue'>
              <svg aria-hidden='true' className='tap-icon' viewBox='0 0 48 48'>
                <circle className='tap-ripple' cx='24' cy='24' r='19' />
                <circle className='tap-ring' cx='24' cy='24' r='12' />
                <circle className='tap-dot' cx='24' cy='24' r='5.5' />
              </svg>
              {translate('screen.tapToPlay')}
            </p>
          </>
        )}
      </div>
      {isRevealed && <span className='reveal-drain' key={revealTouchCount} />}
    </header>
  )
}
