import { composeClassName } from '@adrienlcp/react-aria'
import type React from 'react'
import { Link, type LinkProps } from 'react-aria-components'

import './text-link.sass'

/** A link inside a sentence or a line of text: underlined, in the text's own colour. */
export const TextLink: React.FC<LinkProps> = ({ className, ...props }) => (
  <Link {...props} className={composeClassName(className, 'text-link')} />
)
