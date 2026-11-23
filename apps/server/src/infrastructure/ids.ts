import { customAlphabet, nanoid } from 'nanoid'

import {
  ROOM_CODE_ALPHABET,
  ROOM_CODE_LENGTH,
  type RoomCode,
  type ScreenToken,
  type SeatId
} from '@parallax/protocol/identifiers'

const SCREEN_TOKEN_LENGTH = 32
const SEAT_ID_LENGTH = 10

const drawRoomCode = customAlphabet(ROOM_CODE_ALPHABET, ROOM_CODE_LENGTH)

export const newRoomCode = (): RoomCode => drawRoomCode()

/** A secret: long enough that nobody guesses the screen of a room they know the code of. */
export const newScreenToken = (): ScreenToken => nanoid(SCREEN_TOKEN_LENGTH)

export const newSeatId = (): SeatId => nanoid(SEAT_ID_LENGTH)
