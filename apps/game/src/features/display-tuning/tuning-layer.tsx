import type React from 'react'
import { useEffect } from 'react'

import {
  setTuningPanelOpen,
  useDisplayTuning,
  useIsTuningPanelOpen
} from './display-tuning-store'
import { TuningPanel } from './tuning-panel'
import { useTunedPage } from './use-tuned-page'

import './tuning-layer.sass'

const KEYS_WITHOUT_TEXT = new Set(['checkbox', 'color', 'radio', 'range'])

/** Whether a key pressed on `target` is typing rather than a shortcut. */
const isTyping = (target: EventTarget | null) =>
  target instanceof HTMLTextAreaElement ||
  (target instanceof HTMLInputElement && !KEYS_WITHOUT_TEXT.has(target.type)) ||
  (target instanceof HTMLElement && target.isContentEditable)

/**
 * The display's tuning, on a display surface: applies the tuned backdrop and
 * HUD to the page, and opens or closes the tuning panel on the `T` key.
 */
export const TuningLayer: React.FC = () => {
  const tuning = useDisplayTuning()
  const isPanelOpen = useIsTuningPanelOpen()
  const backdropHex = useTunedPage(tuning)

  useEffect(() => {
    const toggleOnT = (event: KeyboardEvent) => {
      if (
        event.key.toLowerCase() !== 't' ||
        event.repeat ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey ||
        isTyping(event.target)
      ) {
        return
      }
      setTuningPanelOpen(!isPanelOpen)
    }
    addEventListener('keydown', toggleOnT)
    return () => removeEventListener('keydown', toggleOnT)
  }, [isPanelOpen])

  return isPanelOpen ? (
    <TuningPanel backdropHex={backdropHex} tuning={tuning} />
  ) : null
}
