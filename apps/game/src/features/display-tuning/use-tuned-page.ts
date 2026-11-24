import { useLayoutEffect, useState } from 'react'

import { resolveCssColor } from '@/infrastructure/css-color'

import {
  backdropColorOf,
  type DisplayTuning,
  hexOf,
  relativeLuminanceOf,
  toneOfBackdrop
} from './display-tuning'

/**
 * Hands the page its tuned backdrop, the backdrop's tone (which turns the
 * lettering on it dark on a light backdrop), the HUD's scale and what of the
 * HUD is hidden, on the root, for as long as a display surface is shown.
 * Returns the backdrop as `#rrggbb`.
 */
export const useTunedPage = ({ backdrop, hud }: DisplayTuning): string => {
  const [backdropHex, setBackdropHex] = useState('#000000')
  const color = backdropColorOf(backdrop)

  useLayoutEffect(() => {
    const root = document.documentElement
    const resolved = resolveCssColor(color)
    root.style.setProperty('--backdrop', color)
    root.dataset.backdropTone = toneOfBackdrop(relativeLuminanceOf(resolved))
    setBackdropHex(hexOf(resolved))

    return () => {
      root.style.removeProperty('--backdrop')
      delete root.dataset.backdropTone
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
