import type { MiddlewareHandler } from 'hono'

import type { ApiErrorResponse } from '@parallax/protocol/http'

const tooManyRooms: ApiErrorResponse = {
  code: 'rate_limited',
  message: 'Too many rooms opened from this address'
}

/**
 * The platform's counter rather than the isolate's, which holds nothing between
 * two requests. The address is the key and is never written anywhere.
 */
export const limitRoomCreation: MiddlewareHandler<{ Bindings: Env }> = async (
  context,
  next
) => {
  const { success } = await context.env.ROOM_CREATION_LIMITER.limit({
    key: context.req.header('CF-Connecting-IP') ?? 'unknown'
  })

  if (!success) {
    return context.json(tooManyRooms, 429)
  }

  await next()
}
