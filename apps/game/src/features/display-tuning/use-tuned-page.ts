import { useLayoutEffect } from 'react'

import { backdropColorOf, type DisplayTuning } from './display-tuning'
import { useBackdropTone } from './use-backdrop-tone'

/**
 * Hands the page its tuned backdrop, the backdrop's tone (which turns the
 * lettering on it dark on a light backdrop, and follows the game shown when
 * the backdrop is the game's own), the HUD's scale and what of the
 * HUD is hidden, on the root, for as long as a display surface is shown.
 * Returns the backdrop as `#rrggbb`.
 */
export const useTunedPage = ({ backdrop, hud }: DisplayTuning): string => {
  const color = backdropColorOf(backdrop)
  const backdropHex = useBackdropTone(color)

  useLayoutEffect(() => {
    const root = document.documentElement
    root.style.setProperty('--backdrop', color)

    return () => {
      root.style.removeProperty('--backdrop')
    }
  }, [color])

  useLayoutEffect(() => {
    const root = document.documentElement
    const hidden = [
      hud.showHeader ? null : 'header',
      hud.showRoster ? null : 'roster',
      hud.showQr ? null : 'qr'
    ].filter((part) => part !== null)
    root.style.setProperty('--hud-scale', String(hud.scale))
    root.dataset.hudHidden = hidden.join(' ')

    return () => {
      root.style.removeProperty('--hud-scale')
      delete root.dataset.hudHidden
    }
  }, [hud])

  return backdropHex
}
