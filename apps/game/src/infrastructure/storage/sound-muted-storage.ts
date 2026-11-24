import { Result } from '@adrienlcp/result'
import {
  readStoredText,
  removeStored,
  type StorageUnavailable,
  type StorageWriteError,
  writeStoredText
} from '@adrienlcp/safe-storage'

/** Read before the page loads by anyone who has to open the display silently. */
export const SOUND_MUTED_KEY = 'parallax:sound-muted'

const MUTED = 'true'

/** Whether this display was muted, so a reload stays silent. */
export const readSoundMuted = (): Result<boolean, StorageUnavailable> => {
  const stored = readStoredText(SOUND_MUTED_KEY)

  if (stored.status === 'failure') {
    return stored
  }

  return Result.success(stored.data === MUTED)
}

export const writeSoundMuted = (
  isMuted: boolean
): Result<void, StorageWriteError> =>
  isMuted
    ? writeStoredText({ key: SOUND_MUTED_KEY, text: MUTED })
    : removeStored(SOUND_MUTED_KEY)
