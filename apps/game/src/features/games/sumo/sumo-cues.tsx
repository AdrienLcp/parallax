import type React from 'react'

import { useTranslate } from '@/presentation/i18n/i18n-provider'

import './sumo-cues.sass'

/** How the sumo plays, in three pictograms read from across the room: steer by thumb, knock the others off the table, jump to dodge. */
export const SumoCues: React.FC = () => {
  const translate = useTranslate()

  return (
    <ul className='sumo-cues'>
      <li>
        <svg aria-hidden='true' className='cue-icon' viewBox='0 0 48 48'>
          <circle className='cue-line' cx='24' cy='24' r='19' />
          <circle className='cue-fill' cx='31' cy='17' r='8' />
        </svg>
        {translate('sumo.cue.steer')}
      </li>
      <li>
        <svg aria-hidden='true' className='cue-icon' viewBox='0 0 48 48'>
          <circle className='cue-line cue-dashed' cx='24' cy='24' r='14' />
          <circle className='cue-fill' cx='24' cy='24' r='6' />
          <circle className='cue-line' cx='40' cy='38' r='6' />
          <path className='cue-line' d='M30 30 L36 34' />
        </svg>
        {translate('sumo.cue.knockOut')}
      </li>
      <li>
        <svg aria-hidden='true' className='cue-icon' viewBox='0 0 48 48'>
          <path className='cue-line' d='M8 42 Q24 2 40 42' />
          <circle className='cue-fill' cx='24' cy='20' r='6' />
        </svg>
        {translate('sumo.cue.dodge')}
      </li>
    </ul>
  )
}
