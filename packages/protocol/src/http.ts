import { z } from 'zod'

import { protocolErrorCodeSchema } from './error-code'
import { roomCodeSchema, screenTokenSchema } from './identifiers'

/** The one place a `screenToken` reaches a client: the screen that opened the room. */
export const createRoomResponseSchema = z.object({
  code: roomCodeSchema,
  screenToken: screenTokenSchema
})

export const healthResponseSchema = z.object({
  protocolVersion: z.number().int().positive(),
  status: z.literal('ok')
})

/** The socket's codes plus the two only a request can earn. */
export const httpErrorCodeSchema = z.enum([
  ...protocolErrorCodeSchema.options,
  'invalid_input',
  'not_found'
])

/** `code` is the contract a client translates; `message` is English for a log, never rendered. */
export const apiErrorResponseSchema = z.object({
  code: httpErrorCodeSchema,
  message: z.string()
})

export type HttpErrorCode = z.infer<typeof httpErrorCodeSchema>
export type CreateRoomResponse = z.infer<typeof createRoomResponseSchema>
export type HealthResponse = z.infer<typeof healthResponseSchema>
export type ApiErrorResponse = z.infer<typeof apiErrorResponseSchema>
