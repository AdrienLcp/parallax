import { classNames } from '@adrienlcp/react'
import type React from 'react'

import './check-mark.sass'

type CheckMarkProps = {
  className?: string
}

/** A ready seat's tick, drawn in the text colour. Decorative: the word beside it says "ready". */
export const CheckMark: React.FC<CheckMarkProps> = ({ className }) => (
  <svg
    aria-hidden='true'
    className={classNames('check-mark', className)}
    fill='none'
    stroke='currentColor'
    strokeLinecap='round'
    strokeLinejoin='round'
    strokeWidth='12'
    viewBox='0 0 100 100'
  >
    <path d='M16 52 L40 76 L84 26' />
  </svg>
)
