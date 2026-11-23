import { describe, expect, it } from 'vitest'

import { ROOM_SEAT_LIMIT } from '@parallax/protocol/room'

import { games } from './games'

describe('games', () => {
  it.each(Object.entries(games))(
    '%s seats at least one player and no more than a room holds',
    (_, game) => {
      expect(game.players.fewest).toBeGreaterThanOrEqual(1)
      expect(game.players.fewest).toBeLessThanOrEqual(game.players.most)
      expect(game.players.most).toBeLessThanOrEqual(ROOM_SEAT_LIMIT)
    }
  )
})
