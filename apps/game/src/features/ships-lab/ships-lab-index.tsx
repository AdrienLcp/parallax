import type React from 'react'
import { Link } from 'react-router'

import { Main } from '@/presentation/components/main'
import { useTranslate } from '@/presentation/i18n/i18n-provider'

import { FLIGHT_MODES, labScreenPathFor } from './ships-lab-mode'

import './ships-lab-index.sass'

/** The ships' lab, linked from nowhere: the two ways to fly, one screen each. */
export const ShipsLabIndex: React.FC = () => {
  const translate = useTranslate()

  return (
    <Main className='ships-lab-index'>
      <h1>{translate('shipsLab.title')}</h1>
      <ul className='lab-modes'>
        {FLIGHT_MODES.map((mode) => (
          <li key={mode}>
            <Link className='lab-mode' to={labScreenPathFor(mode)}>
              <strong>{translate(`shipsLab.mode.${mode}`)}</strong>
              <span>{translate(`shipsLab.about.${mode}`)}</span>
            </Link>
          </li>
        ))}
      </ul>
    </Main>
  )
}
