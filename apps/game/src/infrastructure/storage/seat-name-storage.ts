import type { Result } from '@adrienlcp/result'
import {
  readRecognizedText,
  removeStored,
  type StorageReadError,
  type StorageUnavailable,
  type StorageWriteError,
  writeStoredText
} from '@adrienlcp/safe-storage'

import { seatNameSchema } from '@parallax/protocol/lobby'

const SEAT_NAME_KEY = 'parallax:seat-name'

const isSeatName = (stored: string): stored is string =>
  seatNameSchema.safeParse(stored).success

/** The name this phone's player picked last, offered again in the next room; `null` before they pick one. */
export const readStoredSeatName = (): Result<string | null, StorageReadError> =>
  readRecognizedText({ isRecognized: isSeatName, key: SEAT_NAME_KEY })

/** Keeps the picked name, or forgets it for `null`: the seat then goes by its colour. */
export const writeStoredSeatName = (
  name: string | null
): Result<void, StorageUnavailable | StorageWriteError> =>
  name === null
    ? removeStored(SEAT_NAME_KEY)
    : writeStoredText({ key: SEAT_NAME_KEY, text: name })
