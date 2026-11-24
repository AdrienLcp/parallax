import { useSyncExternalStore } from 'react'

type Fullscreen = {
  /** False where the browser offers no Fullscreen API, or forbids it here. */
  isAvailable: boolean
  /** Whether the page fills the screen, whoever put it there (this control, F11 or Escape). */
  isFullscreen: boolean
  toggleFullscreen: () => void
}

const subscribe = (onChange: () => void): (() => void) => {
  document.addEventListener('fullscreenchange', onChange)
  return () => document.removeEventListener('fullscreenchange', onChange)
}

const readIsFullscreen = (): boolean => document.fullscreenElement !== null

const readIsAvailable = (): boolean => document.fullscreenEnabled === true

const toggleFullscreen = (): void => {
  const change =
    document.fullscreenElement === null
      ? document.documentElement.requestFullscreen()
      : document.exitFullscreen()

  void change.catch(() => undefined)
}

/**
 * Puts the whole page in the browser's fullscreen and follows it, so the
 * display fills its panel without browser chrome. Fullscreen is held by the
 * document, so it survives the app's own navigation.
 */
export const useFullscreen = (): Fullscreen => ({
  isAvailable: useSyncExternalStore(subscribe, readIsAvailable),
  isFullscreen: useSyncExternalStore(subscribe, readIsFullscreen),
  toggleFullscreen
})
