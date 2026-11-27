import { z } from 'zod'

import { clawDropSchema, clawStateSchema, clawStickSchema } from './claw'
import { roomGameSchema } from './games'
import {
  globePlantSchema,
  globeStateSchema,
  globeStickSchema,
  globeZoomSchema
} from './globe'
import { screenTokenSchema, sessionIdSchema } from './identifiers'
import {
  gameEndedSchema,
  gameStartedSchema,
  seatKickSchema,
  seatLeaveSchema,
  seatReadySchema,
  seatUnreadySchema
} from './lobby'
import { shipsPadSchema } from './ships'
import {
  sumoDashSchema,
  sumoJumpSchema,
  sumoStateSchema,
  sumoStickSchema
} from './sumo'
import {
  towerAimSchema,
  towerDropSchema,
  towerPickSchema,
  towerRuleChoiceSchema,
  towerSpinSchema,
  towerStateSchema
} from './tower'

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
  seatReadySchema,
  seatUnreadySchema,
  gameStartedSchema,
  gameEndedSchema,
  roomGameSchema,
  seatKickSchema,
  seatLeaveSchema,
  sumoStickSchema,
  sumoDashSchema,
  sumoJumpSchema,
  sumoStateSchema,
  towerAimSchema,
  towerDropSchema,
  towerPickSchema,
  towerRuleChoiceSchema,
  towerStateSchema,
  towerSpinSchema,
  clawStickSchema,
  clawDropSchema,
  clawStateSchema,
  globeStickSchema,
  globeZoomSchema,
  globePlantSchema,
  globeStateSchema,
  shipsPadSchema
])

export type Credentials = z.infer<typeof credentialsSchema>
export type HelloMessage = z.infer<typeof helloMessageSchema>
export type ClientMessage = z.infer<typeof clientMessageSchema>
