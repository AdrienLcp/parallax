import type React from 'react'

import { useTranslate } from '@/presentation/i18n/i18n-provider'

import '../sumo/sumo-cues.sass'

/** How the tower plays, in two pictograms read from across the room: aim across and in depth, drop on the tower. */
export const TowerCues: React.FC = () => {
  const translate = useTranslate()

  return (
    <ul className='sumo-cues'>
      <li>
        <svg aria-hidden='true' className='cue-icon' viewBox='0 0 48 48'>
          <path className='cue-line' d='M8 30 L24 38 L40 30 L24 22 Z' />
          <path className='cue-line' d='M24 4 V16 M18 10 H30' />
        </svg>
        {translate('tower.cue.aim')}
      </li>
      <li>
        <svg aria-hidden='true' className='cue-icon' viewBox='0 0 48 48'>
          <rect
            className='cue-fill'
            height='8'
            rx='1'
            width='20'
            x='14'
            y='4'
          />
          <path className='cue-line cue-dashed' d='M24 15 V27' />
          <rect className='cue-line' height='8' width='28' x='10' y='30' />
          <rect className='cue-line' height='6' width='12' x='18' y='38' />
        </svg>
        {translate('tower.cue.drop')}
      </li>
    </ul>
  )
}
