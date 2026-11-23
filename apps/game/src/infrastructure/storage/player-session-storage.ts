import type { Result } from '@adrienlcp/result'
import {
  readRecognizedText,
  type StorageReadError,
  type StorageWriteError,
  writeStoredText
} from '@adrienlcp/safe-storage'

import { type SessionId, sessionIdSchema } from '@parallax/protocol/identifiers'

const PLAYER_SESSION_KEY = 'parallax:player-session'

const isSessionId = (stored: string): stored is SessionId =>
  sessionIdSchema.safeParse(stored).success

/** The id this phone plays under in every room, or `null` before its first game. */
export const readStoredSessionId = (): Result<
  SessionId | null,
  StorageReadError
> => readRecognizedText({ isRecognized: isSessionId, key: PLAYER_SESSION_KEY })

export const writeStoredSessionId = (
  sessionId: SessionId
): Result<void, StorageWriteError> =>
  writeStoredText({ key: PLAYER_SESSION_KEY, text: sessionId })
