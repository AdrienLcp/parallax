import { lazy } from 'react'

import type { GameDefinition } from './game-definition'

export type GameId = 'sumo'

/** Every game the app hosts. Each one's screen and controller load only when it is played. */
export const games = {
  sumo: {
    Controller: lazy(async () => ({
      default: (await import('./sumo/sumo-controller')).SumoController
    })),
    name: 'games.sumo.name',
    players: { fewest: 2, most: 6 },
    Scene: lazy(async () => ({
      default: (await import('./sumo/sumo-scene')).SumoScene
    }))
  }
} satisfies Record<GameId, GameDefinition>

/** Every room plays this game until a room carries the game its screen picked. */
export const CURRENT_GAME: GameId = 'sumo'
