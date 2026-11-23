import type React from 'react'

import { SkipLink } from '@/presentation/components/skip-link'
import { SiteFooter } from '@/presentation/site-footer'

/** The chrome every page sits in. The skip link stays its first child. */
export const AppShell: React.FC<{ children: React.ReactNode }> = ({
  children
}) => (
  <>
    <SkipLink />
    {children}
    <SiteFooter />
  </>
)
