import { useSyncExternalStore } from 'react'

/** Chrome's offer to install the app: not in TypeScript's DOM types. */
type InstallPromptEvent = Event & { prompt: () => Promise<unknown> }

const isInstallPrompt = (event: Event): event is InstallPromptEvent =>
  'prompt' in event && typeof event.prompt === 'function'

let offer: InstallPromptEvent | null = null
const listeners = new Set<() => void>()

const tell = () => {
  for (const listener of listeners) listener()
}

/**
 * Keeps Chrome's install offer for later. It is made once, early in the
 * page's life: listen before the first render, or it is gone.
 */
export const keepInstallOffer = (): void => {
  addEventListener('beforeinstallprompt', (event) => {
    if (!isInstallPrompt(event)) return
    event.preventDefault()
    offer = event
    tell()
  })
  addEventListener('appinstalled', () => {
    offer = null
    tell()
  })
}

const subscribe = (onChange: () => void) => {
  listeners.add(onChange)
  return () => listeners.delete(onChange)
}

const install = () => {
  const pending = offer
  if (pending === null) return
  // An offer is shown once: the next one comes with a later visit.
  offer = null
  tell()
  void pending.prompt().catch(() => undefined)
}

/** What installs the app, or `null` while the browser offers none (installed already, or no support). */
export const useInstall = (): (() => void) | null =>
  useSyncExternalStore(subscribe, () => offer) === null ? null : install
