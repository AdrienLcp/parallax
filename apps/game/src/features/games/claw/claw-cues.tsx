import type React from 'react'

import { useTranslate } from '@/presentation/i18n/i18n-provider'

import '../sumo/sumo-cues.sass'

/** How the claw plays, in two pictograms read from across the room: steer it over the pile, drop it on a prize. */
export const ClawCues: React.FC = () => {
  const translate = useTranslate()

  return (
    <ul className='sumo-cues'>
      <li>
        <svg aria-hidden='true' className='cue-icon' viewBox='0 0 48 48'>
          <path className='cue-line' d='M8 30 L24 38 L40 30 L24 22 Z' />
          <path className='cue-line' d='M6 8 H42 M24 8 V18' />
          <path className='cue-line' d='M18 24 L20 18 H28 L30 24' />
        </svg>
        {translate('claw.cue.aim')}
      </li>
      <li>
        <svg aria-hidden='true' className='cue-icon' viewBox='0 0 48 48'>
          <path className='cue-line cue-dashed' d='M24 4 V16' />
          <path className='cue-line' d='M16 26 Q16 18 24 18 Q32 18 32 26' />
          <path className='cue-line' d='M16 26 L14 32 M32 26 L34 32' />
          <circle className='cue-fill' cx='24' cy='36' r='7' />
        </svg>
        {translate('claw.cue.drop')}
      </li>
    </ul>
  )
}
