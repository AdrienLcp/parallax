import { lazy } from 'react'

import type { GameId } from '@parallax/protocol/games'

import { ClawCues } from './claw/claw-cues'
import { ClawPreview } from './claw/claw-preview'
import { CLAW_PLAYERS } from './claw/claw-tuning'
import type { GameDefinition } from './game-definition'
import { GlobeCues } from './globe/globe-cues'
import { GlobePreview } from './globe/globe-preview'
import { GLOBE_PLAYERS } from './globe/globe-tuning'
import { SumoCues } from './sumo/sumo-cues'
import { SumoPreview } from './sumo/sumo-preview'
import { SUMO_PLAYERS } from './sumo/sumo-tuning'
import { TowerCues } from './tower/tower-cues'
import { TowerPreview } from './tower/tower-preview'
import { TOWER_PLAYERS } from './tower/tower-tuning'

import './claw/claw-world.sass'
import './globe/globe-world.sass'
import './sumo/sumo-world.sass'
import './tower/tower-world.sass'

export {
  DEFAULT_GAME_ID,
  GAME_IDS,
  type GameId
} from '@parallax/protocol/games'

/** Every game the app hosts. Each one's scene, controller and showcase load only when shown. */
export const games = {
  claw: {
    Controller: lazy(async () => ({
      default: (await import('./claw/claw-controller')).ClawController
    })),
    Cues: ClawCues,
    name: 'games.claw.name',
    Preview: ClawPreview,
    players: CLAW_PLAYERS,
    Scene: lazy(async () => ({
      default: (await import('./claw/claw-scene')).ClawScene
    })),
    Showcase: lazy(async () => ({
      default: (await import('./claw/claw-showcase')).ClawShowcase
    }))
  },
  globe: {
    Controller: lazy(async () => ({
      default: (await import('./globe/globe-controller')).GlobeController
    })),
    Cues: GlobeCues,
    name: 'games.globe.name',
    Preview: GlobePreview,
    players: GLOBE_PLAYERS,
    Scene: lazy(async () => ({
      default: (await import('./globe/globe-scene')).GlobeScene
    })),
    Showcase: lazy(async () => ({
      default: (await import('./globe/globe-showcase')).GlobeShowcase
    }))
  },
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
