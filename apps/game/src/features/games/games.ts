import { lazy } from 'react'

import type { GameDefinition } from './game-definition'
import { SumoCues } from './sumo/sumo-cues'
import { SumoPreview } from './sumo/sumo-preview'
import { SUMO_PLAYERS } from './sumo/sumo-tuning'

import './sumo/sumo-world.sass'

/** Every game the app hosts, in the order the game choice lists them. */
export const GAME_IDS = ['sumo'] as const

export type GameId = (typeof GAME_IDS)[number]

/** Every game the app hosts. Each one's scene, controller and showcase load only when shown. */
export const games = {
  sumo: {
    Controller: lazy(async () => ({
      default: (await import('./sumo/sumo-controller')).SumoController
    })),
    Cues: SumoCues,
    name: 'games.sumo.name',
    Preview: SumoPreview,
    players: SUMO_PLAYERS,
    Scene: lazy(async () => ({
      default: (await import('./sumo/sumo-scene')).SumoScene
    })),
    Showcase: lazy(async () => ({
      default: (await import('./sumo/sumo-showcase')).SumoShowcase
    }))
  }
} satisfies Record<GameId, GameDefinition>

/** Every room plays this game until a room carries the game its screen picked. */
export const CURRENT_GAME: GameId = 'sumo'
