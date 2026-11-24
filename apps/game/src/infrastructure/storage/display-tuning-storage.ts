import type { Result } from '@adrienlcp/result'
import {
  readStoredJson,
  removeStored,
  type StorageReadError,
  type StorageWriteError,
  writeStoredJson
} from '@adrienlcp/safe-storage'

const DISPLAY_TUNING_KEY = 'parallax:display-tuning'

const isAnything = (value: unknown): value is unknown => value !== undefined

/** The tuning this display was left on, as stored: the caller reads it defensively. */
export const readStoredDisplayTuning = (): Result<unknown, StorageReadError> =>
  readStoredJson({ isValue: isAnything, key: DISPLAY_TUNING_KEY })

export const writeStoredDisplayTuning = (
  tuning: unknown
): Result<void, StorageWriteError> =>
  writeStoredJson({ key: DISPLAY_TUNING_KEY, value: tuning })

export const removeStoredDisplayTuning = (): Result<void, StorageWriteError> =>
  removeStored(DISPLAY_TUNING_KEY)
