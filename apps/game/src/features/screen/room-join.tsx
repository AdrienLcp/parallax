import type React from 'react'

import type { RoomCode } from '@parallax/protocol/identifiers'

import { useTranslate } from '@/presentation/i18n/i18n-provider'

import { RoomPlaque } from './room-plaque'
import { RoomQr } from './room-qr'

import './room-join.sass'

type RoomJoinProps = {
  code: RoomCode
}

/** How a passer-by joins from across the room: the code to scan, the room's plaque, and two cues. */
export const RoomJoin: React.FC<RoomJoinProps> = ({ code }) => {
  const translate = useTranslate()

  return (
    <header className='room-join'>
      <RoomQr code={code} />
      <div>
        <h1 className='join-heading'>{translate('screen.join')}</h1>
        <RoomPlaque code={code} />
      </div>
      <ul className='join-cues'>
        <li>
          <svg aria-hidden='true' className='cue-icon' viewBox='0 0 48 48'>
            <circle className='cue-line' cx='24' cy='24' r='19' />
            <circle className='cue-fill' cx='31' cy='17' r='8' />
          </svg>
          {translate('screen.cue.steer')}
        </li>
        <li>
          <svg aria-hidden='true' className='cue-icon' viewBox='0 0 48 48'>
            <circle className='cue-line cue-dashed' cx='24' cy='24' r='14' />
            <circle className='cue-fill' cx='24' cy='24' r='6' />
            <circle className='cue-line' cx='40' cy='38' r='6' />
            <path className='cue-line' d='M30 30 L36 34' />
          </svg>
          {translate('screen.cue.knockOut')}
        </li>
      </ul>
    </header>
  )
}
