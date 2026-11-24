import { useSyncExternalStore } from 'react'

import {
  readStoredDisplayTuning,
  removeStoredDisplayTuning,
  writeStoredDisplayTuning
} from '@/infrastructure/storage/display-tuning-storage'

import {
  type DisplayTuning,
  parseTuning,
  SHIPPED_TUNING
} from './display-tuning'

const readStartingTuning = (): DisplayTuning => {
  const stored = readStoredDisplayTuning()
  return stored.status === 'success' && stored.data !== null
    ? parseTuning(stored.data)
    : SHIPPED_TUNING
}

/** The URL flag that opens the tuning panel as the display loads. */
const TUNE_FLAG = 'tune'

// Both are read on first use, once a page is there to read them from.
let tuning: DisplayTuning | null = null
let isPanelOpen: boolean | null = null

const currentTuning = () => {
  tuning ??= readStartingTuning()
  return tuning
}

const currentPanelOpen = () => {
  isPanelOpen ??= new URLSearchParams(location.search).has(TUNE_FLAG)
  return isPanelOpen
}
const listeners = new Set<() => void>()

const subscribe = (listener: () => void) => {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

const notify = () => {
  for (const listener of listeners) listener()
}

/** The display's tuning as it stands, kept in this browser so a reload and the renderer start from it. */
export const useDisplayTuning = (): DisplayTuning =>
  useSyncExternalStore(subscribe, currentTuning)

/** Applies a change at once, everywhere it is read, and keeps it. */
export const updateDisplayTuning = (
  change: (current: DisplayTuning) => DisplayTuning
): void => {
  const next = change(currentTuning())
  tuning = next
  writeStoredDisplayTuning(next)
  notify()
}

/** Back to the shipped values, and nothing kept. */
export const resetDisplayTuning = (): void => {
  tuning = SHIPPED_TUNING
  removeStoredDisplayTuning()
  notify()
}

/** Whether the tuning panel is open: by the `T` key, or from load by `?tune`. It stays open across the display's pages. */
export const useIsTuningPanelOpen = (): boolean =>
  useSyncExternalStore(subscribe, currentPanelOpen)

export const setTuningPanelOpen = (isOpen: boolean): void => {
  isPanelOpen = isOpen
  notify()
}
