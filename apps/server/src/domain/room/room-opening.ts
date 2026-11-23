import { Result } from '@adrienlcp/result'

import type { RoomCode, ScreenToken } from '@parallax/protocol/identifiers'

import type { OpenedRoom } from './room'
import type { Rooms } from './rooms'

/** Codes drawn before giving up: a few hundred thousand codes make even two collisions in a row rare. */
const OPEN_ATTEMPTS = 20

/** Opens a room under a code nobody holds yet, drawing again when the one drawn is taken. */
export const openFreshRoom = async ({
  attemptsLeft = OPEN_ATTEMPTS,
  newRoomCode,
  newScreenToken,
  rooms
}: {
  attemptsLeft?: number
  newRoomCode: () => RoomCode
  newScreenToken: () => ScreenToken
  rooms: Rooms
}): Promise<Result<OpenedRoom, 'no_free_code'>> => {
  if (attemptsLeft === 0) {
    return Result.failure('no_free_code')
  }

  const room: OpenedRoom = {
    code: newRoomCode(),
    screenToken: newScreenToken()
  }
  const opened = await rooms.open(room)

  return opened.status === 'success'
    ? Result.success(room)
    : openFreshRoom({
        attemptsLeft: attemptsLeft - 1,
        newRoomCode,
        newScreenToken,
        rooms
      })
}
