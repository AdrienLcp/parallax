import { useState } from 'react'

import type { SessionId } from '@parallax/protocol/identifiers'

import { warnOnFailure } from '@/infrastructure/diagnostics'
import { newSessionId } from '@/infrastructure/ids'
import {
  readStoredSessionId,
  writeStoredSessionId
} from '@/infrastructure/storage/player-session-storage'

/**
 * Where storage is refused, the phone still plays under a fresh id, but a
 * reload takes a new seat instead of its own.
 */
const storedOrNewSessionId = (): SessionId => {
  const stored = readStoredSessionId()
  warnOnFailure(stored, 'Reading the player session')

  if (stored.status === 'success' && stored.data !== null) {
    return stored.data
  }

  const minted = newSessionId()
  warnOnFailure(writeStoredSessionId(minted), 'Storing the player session')

  return minted
}

/** The id this phone plays under, the same in every room and across reloads. */
export const usePlayerSessionId = (): SessionId =>
  useState(storedOrNewSessionId)[0]
