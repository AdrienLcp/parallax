import type React from 'react'

import './spinner.sass'

/** A turning ring beside a word that already says what is awaited. */
export const Spinner: React.FC = () => (
  <span aria-hidden='true' className='spinner' />
)
