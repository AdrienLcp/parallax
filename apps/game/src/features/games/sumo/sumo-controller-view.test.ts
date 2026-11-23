import { describe, expect, it } from 'vitest'

import type { SumoState } from '@parallax/protocol/sumo'

import { sumoControllerView } from './sumo-controller-view'
import { SUMO_TUNING } from './sumo-tuning'

const stateOf = (
  phase: SumoState['phase'],
  ownStatus: 'out' | 'spinning' | null,
  ownRoundsWon = 0
): SumoState => ({
  phase,
  tops: [
    { outBy: null, roundsWon: 0, seatId: 'rival', status: 'spinning' },
    ...(ownStatus === null
      ? []
      : [
          {
            outBy: null,
            roundsWon: ownRoundsWon,
            seatId: 'own',
            status: ownStatus
          }
        ])
  ],
  type: 'sumo.state'
})

describe('sumoControllerView', () => {
  it('waits in the lobby before the screen said anything', () => {
    expect(sumoControllerView({ seatId: 'own', state: null })).toBe('lobby')
  })

  it('waits in the lobby while the room gathers', () => {
    expect(
      sumoControllerView({ seatId: 'own', state: stateOf('lobby', 'spinning') })
    ).toBe('lobby')
  })

  it('waits in the lobby when the round started without this seat', () => {
    expect(
      sumoControllerView({ seatId: 'own', state: stateOf('fighting', null) })
    ).toBe('lobby')
  })

  it('plays through the countdown and the fight', () => {
    expect(
      sumoControllerView({
        seatId: 'own',
        state: stateOf('countdown', 'spinning')
      })
    ).toBe('playing')
    expect(
      sumoControllerView({
        seatId: 'own',
        state: stateOf('fighting', 'spinning')
      })
    ).toBe('playing')
  })

  it('shows the gutter once its top is out, until the next round', () => {
    expect(
      sumoControllerView({ seatId: 'own', state: stateOf('fighting', 'out') })
    ).toBe('out')
    expect(
      sumoControllerView({ seatId: 'own', state: stateOf('decided', 'out') })
    ).toBe('out')
  })

  it('wins the round when it is decided with its top still spinning', () => {
    expect(
      sumoControllerView({
        seatId: 'own',
        state: stateOf('decided', 'spinning', 1)
      })
    ).toBe('roundWon')
  })

  it('wins the match when that round brought it to the goal', () => {
    expect(
      sumoControllerView({
        seatId: 'own',
        state: stateOf('decided', 'spinning', SUMO_TUNING.roundsToWin)
      })
    ).toBe('matchWon')
  })
})
