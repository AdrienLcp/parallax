import type React from 'react'

import { SkipLink } from '@/presentation/components/skip-link'
import { SiteFooter } from '@/presentation/site-footer'

type AppShellProps = {
  children: React.ReactNode
  /** A game page holds the whole viewport: no footer under it. */
  isFullBleed: boolean
}

/** The chrome every page sits in. The skip link stays its first child. */
export const AppShell: React.FC<AppShellProps> = ({
  children,
  isFullBleed
}) => (
  <>
    <SkipLink />
    {children}
    {!isFullBleed && <SiteFooter />}
  </>
)
