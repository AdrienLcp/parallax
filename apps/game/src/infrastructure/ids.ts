import { nanoid } from 'nanoid'

import type { SessionId } from '@parallax/protocol/identifiers'

const SESSION_ID_LENGTH = 16

/** A phone's own id, minted once and kept in its storage so it gets its seat back. */
export const newSessionId = (): SessionId => nanoid(SESSION_ID_LENGTH)
