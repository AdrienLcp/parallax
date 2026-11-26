import { lazy } from 'react'

import type { GameId } from '@parallax/protocol/games'

import type { GameDefinition } from './game-definition'
import { SumoCues } from './sumo/sumo-cues'
import { SumoPreview } from './sumo/sumo-preview'
import { SUMO_PLAYERS } from './sumo/sumo-tuning'
import { TowerCues } from './tower/tower-cues'
import { TowerPreview } from './tower/tower-preview'
import { TOWER_PLAYERS } from './tower/tower-tuning'

import './sumo/sumo-world.sass'
import './tower/tower-world.sass'
import './tower/tower-room.sass'

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
  },
  tower: {
    Controller: lazy(async () => ({
      default: (await import('./tower/tower-controller')).TowerController
    })),
    Cues: TowerCues,
    name: 'games.tower.name',
    Preview: TowerPreview,
    players: TOWER_PLAYERS,
    Scene: lazy(async () => ({
      default: (await import('./tower/tower-scene')).TowerScene
    })),
    Showcase: lazy(async () => ({
      default: (await import('./tower/tower-showcase')).TowerShowcase
    }))
  }
} satisfies Record<GameId, GameDefinition>
