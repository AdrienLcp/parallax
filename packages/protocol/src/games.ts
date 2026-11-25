import { z } from 'zod'

/**
 * Every game a room can play, in the order the game choice lists them. A new
 * game is added here and in the app's registry together: both ends ship from
 * this repository.
 */
export const GAME_IDS = ['sumo', 'tower'] as const

export const gameIdSchema = z.enum(GAME_IDS)

/** What a fresh room plays until someone picks another game. */
export const DEFAULT_GAME_ID = 'sumo' satisfies GameId

/**
 * Where the room stands: in its lobby (seats gather, the game can change) or
 * in a game the screen runs. A game over, or stopped, brings the room back to
 * its lobby with every seat kept.
 */
export const roomPhaseSchema = z.enum(['lobby', 'playing'])

/** Any seated phone, or the screen, picks the game the room plays next. Lobby only. */
export const roomGameSchema = z.object({
  game: gameIdSchema,
  type: z.literal('room.game')
})

export type GameId = z.infer<typeof gameIdSchema>
export type RoomPhase = z.infer<typeof roomPhaseSchema>
export type RoomGame = z.infer<typeof roomGameSchema>
