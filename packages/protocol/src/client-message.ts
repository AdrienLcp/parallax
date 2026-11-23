import { z } from 'zod'

import { screenTokenSchema, sessionIdSchema } from './identifiers'
import { sumoDashSchema, sumoStateSchema, sumoStickSchema } from './sumo'

export const screenCredentialsSchema = z.object({
  role: z.literal('screen'),
  screenToken: screenTokenSchema
})

export const playerCredentialsSchema = z.object({
  role: z.literal('player'),
  sessionId: sessionIdSchema
})

export const credentialsSchema = z.discriminatedUnion('role', [
  screenCredentialsSchema,
  playerCredentialsSchema
])

/** The first frame of every socket: who it is, and which protocol it speaks. */
export const helloMessageSchema = z.object({
  credentials: credentialsSchema,
  protocolVersion: z.number().int().positive(),
  type: z.literal('hello')
})

/** Answered even before `hello`, so a client can tell a dead socket from a quiet room. */
export const pingMessageSchema = z.object({ type: z.literal('ping') })

/** Every frame a client may send; which role may send which is the server's rule. */
export const clientMessageSchema = z.discriminatedUnion('type', [
  helloMessageSchema,
  pingMessageSchema,
  sumoStickSchema,
  sumoDashSchema,
  sumoStateSchema
])

export type Credentials = z.infer<typeof credentialsSchema>
export type HelloMessage = z.infer<typeof helloMessageSchema>
export type ClientMessage = z.infer<typeof clientMessageSchema>
