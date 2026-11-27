import type React from 'react'

import { useTranslate } from '@/presentation/i18n/i18n-provider'

import '../sumo/sumo-cues.sass'

/** How Terre plays, in three pictograms read from across the room: turn the globe, look through the loupe, plant the pin. */
export const GlobeCues: React.FC = () => {
  const translate = useTranslate()

  return (
    <ul className='sumo-cues'>
      <li>
        <svg aria-hidden='true' className='cue-icon' viewBox='0 0 48 48'>
          <circle className='cue-line' cx='24' cy='24' r='16' />
          <path
            className='cue-line'
            d='M8 24 H40 M24 8 Q14 24 24 40 Q34 24 24 8'
          />
          <path
            className='cue-line'
            d='M4 34 Q6 42 14 44 M10 46 L14 44 L12 40'
          />
        </svg>
        {translate('globe.cue.turn')}
      </li>
      <li>
        <svg aria-hidden='true' className='cue-icon' viewBox='0 0 48 48'>
          <circle className='cue-line' cx='20' cy='20' r='13' />
          <path className='cue-line' d='M30 30 L42 42' />
          <path className='cue-line' d='M14 20 H26 M20 14 V26' />
        </svg>
        {translate('globe.cue.zoom')}
      </li>
      <li>
        <svg aria-hidden='true' className='cue-icon' viewBox='0 0 48 48'>
          <circle className='cue-fill' cx='24' cy='12' r='7' />
          <path className='cue-line' d='M24 19 V36' />
          <path className='cue-line cue-dashed' d='M10 40 Q24 46 38 40' />
        </svg>
        {translate('globe.cue.plant')}
      </li>
    </ul>
  )
}
