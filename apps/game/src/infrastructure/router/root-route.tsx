import type React from 'react'
import { useEffect, useRef } from 'react'
import {
  type NavigateOptions,
  Outlet,
  ScrollRestoration,
  useHref,
  useLocation,
  useMatch,
  useNavigate
} from 'react-router'

import { paths } from '@/infrastructure/router/navigation'
import { AppShell } from '@/presentation/app-shell'
import { focusMain } from '@/presentation/components/main'
import { RouterProvider } from '@/presentation/components/router-provider'

declare module 'react-aria-components' {
  interface RouterConfig {
    routerOptions: NavigateOptions
  }
}

const ABSOLUTE_URL = /^[a-z][a-z\d+.-]*:/i

/** react-router resolves every href against the route; an external URL stays whole. */
const useRouterHref = (href: string): string => {
  const routeHref = useHref(href)

  return ABSOLUTE_URL.test(href) ? href : routeHref
}

const hrefResolution = { useHref: useRouterHref }

/**
 * A navigation superseded by the next one rejects with `AbortError`:
 * expected control flow, not a failure.
 */
const ignoreSupersededNavigation = (error: unknown): void => {
  if (error instanceof Error && error.name === 'AbortError') {
    return
  }

  throw error
}

const useFocusMainOnNavigation = (): void => {
  const { pathname } = useLocation()
  const previousPathname = useRef(pathname)

  useEffect(() => {
    if (previousPathname.current === pathname) {
      return
    }

    previousPathname.current = pathname
    focusMain({ preventScroll: true })
  }, [pathname])
}

const useIsGamePage = (): boolean => {
  const playMatch = useMatch(paths.play)
  const screenMatch = useMatch(paths.screen)

  return playMatch !== null || screenMatch !== null
}

export const RootRoute: React.FC = () => {
  const navigate = useNavigate()
  const isGamePage = useIsGamePage()
  useFocusMainOnNavigation()

  return (
    <RouterProvider
      navigate={(path, options) => {
        void Promise.resolve(navigate(path, options)).catch(
          ignoreSupersededNavigation
        )
      }}
      {...hrefResolution}
    >
      <AppShell isFullBleed={isGamePage}>
        <Outlet />
      </AppShell>
      <ScrollRestoration />
    </RouterProvider>
  )
}
