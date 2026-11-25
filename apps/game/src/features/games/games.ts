import { lazy } from 'react'

import type { GameId } from '@parallax/protocol/games'

import type { GameDefinition } from './game-definition'
import { SumoCues } from './sumo/sumo-cues'
import { SumoPreview } from './sumo/sumo-preview'
import { SUMO_PLAYERS } from './sumo/sumo-tuning'

import './sumo/sumo-world.sass'
import './tower/tower-world.sass'

export {
  DEFAULT_GAME_ID,
  GAME_IDS,
  type GameId
} from '@parallax/protocol/games'

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
