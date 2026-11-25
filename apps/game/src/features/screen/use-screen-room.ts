import { useEffect, useState } from 'react'

import type { GameId } from '@parallax/protocol/games'
import type { CreateRoomResponse } from '@parallax/protocol/http'

import { type OpenRoomError, openRoom } from '@/infrastructure/api/rooms-api'
import { warnOnFailure } from '@/infrastructure/diagnostics'
import {
  readStoredScreenRoom,
  writeStoredScreenRoom
} from '@/infrastructure/storage/screen-room-storage'

export type ScreenRoomState =
  | { kind: 'opening' }
  | { kind: 'open'; room: CreateRoomResponse }
  | { error: OpenRoomError; kind: 'failed' }

const OPENING: ScreenRoomState = { kind: 'opening' }

const storedRoomOrOpening = (): ScreenRoomState => {
  const stored = readStoredScreenRoom()
  warnOnFailure(stored, 'Reading the screen room')

  return stored.status === 'success' && stored.data !== null
    ? { kind: 'open', room: stored.data }
    : OPENING
}

/**
 * The room this display shows: the one it opened last, taken back after a
 * reload, or a fresh one. `openAnother` gives it up for a new room — once the
 * server no longer knows it, or to retry a failed opening.
 */
export const useScreenRoom = (
  /** The game a fresh room opens on. */
  game: GameId
): {
  openAnother: () => void
  state: ScreenRoomState
} => {
  const [state, setState] = useState(storedRoomOrOpening)
  const isOpening = state.kind === 'opening'

  useEffect(() => {
    if (!isOpening) {
      return
    }

    const request = new AbortController()

    void openRoom(game, request.signal).then((opened) => {
      if (opened.status === 'failure') {
        if (opened.error !== 'aborted') {
          setState({ error: opened.error, kind: 'failed' })
        }

        return
      }

      warnOnFailure(
        writeStoredScreenRoom(opened.data),
        'Storing the screen room'
      )
      setState({ kind: 'open', room: opened.data })
    })

    return () => request.abort()
  }, [game, isOpening])

  return { openAnother: () => setState(OPENING), state }
}
