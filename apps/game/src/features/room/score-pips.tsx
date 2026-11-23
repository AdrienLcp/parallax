import { classNames } from '@adrienlcp/react'
import type React from 'react'

import { useTranslate } from '@/presentation/i18n/i18n-provider'

import './score-pips.sass'

type ScorePipsProps = {
  className?: string
  /** The rounds the match needs. */
  goal: number
  /** The rounds this seat has won. */
  score: number
}

/**
 * One ring per round the match needs, filled for each round won. Sized and
 * coloured by its caller through `--pip-size`, `--pip-stroke`, `--pip-gap`
 * and `--pip-color`.
 */
export const ScorePips: React.FC<ScorePipsProps> = ({
  className,
  goal,
  score
}) => {
  const translate = useTranslate()

  return (
    <span
      aria-label={translate('score', { goal, score })}
      className={classNames('score-pips', className)}
      role='img'
    >
      {Array.from({ length: goal }, (_, pip) => pip + 1).map((round) => (
        <span
          className='score-pip'
          data-won={round <= score ? '' : undefined}
          key={round}
        />
      ))}
    </span>
  )
}
