import { Result } from '@adrienlcp/result'

import {
  apiErrorResponseSchema,
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

/** Opens a fresh room for this display; only the answer carries its screen token. */
export const openRoom = async (
  signal: AbortSignal
): Promise<Result<CreateRoomResponse, OpenRoomError>> => {
  let response: Response
  let body: unknown

  try {
    response = await fetch(API_ROUTES.rooms, { method: 'POST', signal })
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
