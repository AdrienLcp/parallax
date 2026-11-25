import { Result } from '@adrienlcp/result'

import type { GameId } from '@parallax/protocol/games'
import {
  apiErrorResponseSchema,
  type CreateRoomRequest,
  type CreateRoomResponse,
  createRoomResponseSchema,
  type HttpErrorCode
} from '@parallax/protocol/http'
import { API_ROUTES } from '@parallax/protocol/routes'

export type OpenRoomError =
  | HttpErrorCode
  | 'aborted'
  | 'network'
  | 'unexpected_response'

/** Opens a fresh room for this display on a game; only the answer carries its screen token. */
export const openRoom = async (
  game: GameId,
  signal: AbortSignal
): Promise<Result<CreateRoomResponse, OpenRoomError>> => {
  let response: Response
  let body: unknown

  try {
    const request: CreateRoomRequest = { game }
    response = await fetch(API_ROUTES.rooms, {
      body: JSON.stringify(request),
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
      signal
    })
    body = await response.json()
  } catch {
    return Result.failure(signal.aborted ? 'aborted' : 'network')
  }

  if (!response.ok) {
    const apiError = apiErrorResponseSchema.safeParse(body)
    return Result.failure(
      apiError.success ? apiError.data.code : 'unexpected_response'
    )
  }

  const room = createRoomResponseSchema.safeParse(body)

  return room.success
    ? Result.success(room.data)
    : Result.failure('unexpected_response')
}
