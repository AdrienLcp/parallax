import { z } from 'zod'

import { protocolErrorCodeSchema } from './error-code'
import { gameIdSchema, roomPhaseSchema } from './games'
import { roomCodeSchema, seatIdSchema } from './identifiers'
import { seatSchema } from './room'
import {
  sumoSeatDashSchema,
  sumoSeatStickSchema,
  sumoStateSchema
} from './sumo'
import {
  towerSeatAimSchema,
  towerSeatDropSchema,
  towerSeatRuleChoiceSchema,
  towerStateSchema
} from './tower'

/** A fatal error is followed by the socket closing; the client stops retrying. */
export const errorMessageSchema = z.object({
  code: protocolErrorCodeSchema,
  isFatal: z.boolean(),
  type: z.literal('error')
})

export const pongMessageSchema = z.object({ type: z.literal('pong') })

/** What any socket may be answered, whatever its role, even before it said hello. */
export const replyMessageSchema = z.discriminatedUnion('type', [
  errorMessageSchema,
  pongMessageSchema
])

/** The whole room as the screen sees it, sent on every change: never a delta. */
export const screenRoomMessageSchema = z.object({
  code: roomCodeSchema,
  game: gameIdSchema,
  phase: roomPhaseSchema,
  seats: z.array(seatSchema),
  type: z.literal('room.updated')
})

/** The whole room as a phone sees it, its own seat named. */
export const playerRoomMessageSchema = screenRoomMessageSchema.extend({
  youId: seatIdSchema
})

/** What only a screen hears: the room and the phones' input. */
export const screenEventSchema = z.discriminatedUnion('type', [
  screenRoomMessageSchema,
  sumoSeatStickSchema,
  sumoSeatDashSchema,
  towerSeatAimSchema,
  towerSeatDropSchema,
  towerSeatRuleChoiceSchema
])

/** What only a phone hears: the room and the game as the screen tells it. */
export const playerEventSchema = z.discriminatedUnion('type', [
  playerRoomMessageSchema,
  sumoStateSchema,
  towerStateSchema
])

export const screenServerMessageSchema = z.discriminatedUnion('type', [
  ...replyMessageSchema.options,
  ...screenEventSchema.options
])

export const playerServerMessageSchema = z.discriminatedUnion('type', [
  ...replyMessageSchema.options,
  ...playerEventSchema.options
])

export type ErrorMessage = z.infer<typeof errorMessageSchema>
export type ReplyMessage = z.infer<typeof replyMessageSchema>
export type ScreenRoomMessage = z.infer<typeof screenRoomMessageSchema>
export type PlayerRoomMessage = z.infer<typeof playerRoomMessageSchema>
export type ScreenEvent = z.infer<typeof screenEventSchema>
export type PlayerEvent = z.infer<typeof playerEventSchema>
export type ScreenServerMessage = z.infer<typeof screenServerMessageSchema>
export type PlayerServerMessage = z.infer<typeof playerServerMessageSchema>
