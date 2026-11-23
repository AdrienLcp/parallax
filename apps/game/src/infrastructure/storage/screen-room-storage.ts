import type { Result } from '@adrienlcp/result'
import {
  readStoredJson,
  type StorageReadError,
  type StorageWriteError,
  writeStoredJson
} from '@adrienlcp/safe-storage'

import {
  type CreateRoomResponse,
  createRoomResponseSchema
} from '@parallax/protocol/http'

const SCREEN_ROOM_KEY = 'parallax:screen-room'

const isScreenRoom = (value: unknown): value is CreateRoomResponse =>
  createRoomResponseSchema.safeParse(value).success

/**
 * The room this display opened last, with the token that proves it is its
 * screen: a reloaded display takes its room back instead of opening another.
 */
export const readStoredScreenRoom = (): Result<
  CreateRoomResponse | null,
  StorageReadError
> => readStoredJson({ isValue: isScreenRoom, key: SCREEN_ROOM_KEY })

export const writeStoredScreenRoom = (
  room: CreateRoomResponse
): Result<void, StorageWriteError> =>
  writeStoredJson({ key: SCREEN_ROOM_KEY, value: room })
