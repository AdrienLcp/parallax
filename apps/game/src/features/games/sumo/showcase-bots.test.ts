import { describe, expect, it } from 'vitest'

import { lengthOf, ORIGIN } from '@/helpers/planar-vector'

import {
  BOT_STICK_MAGNITUDE,
  BOT_WANDER_REACH,
  botDashes,
  botInputsOf,
  botStickToward,
  wanderTargetOf
} from './showcase-bots'
import type { SpinningTop } from './sumo-physics'
import { SUMO_STEP_SECONDS } from './sumo-tuning'

const spinningTop = (
  seat: string,
  position: { x: number; y: number },
  dashCooldown = 0
): SpinningTop => ({
  dashCooldown,
  jumpCooldown: 0,
  jumpElapsed: null,
  lastContact: null,
  position,
  seat,
  status: 'spinning',
  velocity: ORIGIN
})

const ALWAYS = 0
const NEVER = 0.999

describe('showcase bots', () => {
  it('[showcase] a bot steers toward its target at the demo tilt', () => {
    const stick = botStickToward({
      position: { x: 0, y: 0 },
      target: { x: 0.6, y: 0 }
    })
    expect(stick.x).toBeCloseTo(BOT_STICK_MAGNITUDE)
    expect(stick.y).toBeCloseTo(0)
  })

  it('[showcase] a bot on its target lets go of the stick', () => {
    expect(
      botStickToward({
        position: { x: 0.3, y: 0.3 },
        target: { x: 0.3, y: 0.3 }
      })
    ).toBe(ORIGIN)
  })

  it('[showcase] a wandering bot never heads past the wander reach', () => {
    for (let clock = 0; clock < 120; clock += 0.37) {
      for (const phase of [0, 1, 3, 4]) {
        expect(lengthOf(wanderTargetOf({ clock, phase }))).toBeLessThanOrEqual(
          BOT_WANDER_REACH + 1e-9
        )
      }
    }
  })

  it('[showcase] a bot dashes only at a rival close in front, by chance', () => {
    const top = spinningTop('red', { x: 0, y: 0 })
    const ahead = spinningTop('blue', { x: 0.3, y: 0 })
    const behind = spinningTop('blue', { x: -0.3, y: 0 })
    const input = { seconds: SUMO_STEP_SECONDS, stick: { x: 0.45, y: 0 }, top }

    expect(botDashes({ ...input, rivals: [top, ahead], roll: ALWAYS })).toBe(
      true
    )
    expect(botDashes({ ...input, rivals: [top, ahead], roll: NEVER })).toBe(
      false
    )
    expect(botDashes({ ...input, rivals: [top, behind], roll: ALWAYS })).toBe(
      false
    )
  })

  it('[showcase] a bot never dashes before it recharged', () => {
    const top = spinningTop('red', { x: 0, y: 0 }, 0.5)
    const ahead = spinningTop('blue', { x: 0.3, y: 0 })
    expect(
      botDashes({
        rivals: [top, ahead],
        roll: ALWAYS,
        seconds: SUMO_STEP_SECONDS,
        stick: { x: 0.45, y: 0 },
        top
      })
    ).toBe(false)
  })

  it('[showcase] only spinning tops are driven', () => {
    const { controls } = botInputsOf({
      clock: 1,
      phaseOf: () => 0,
      random: () => NEVER,
      seconds: SUMO_STEP_SECONDS,
      tops: [
        spinningTop('red', { x: 0, y: 0 }),
        {
          fallElapsed: 0.1,
          outBy: null,
          position: { x: 1.1, y: 0 },
          seat: 'blue',
          status: 'falling',
          velocity: ORIGIN
        }
      ]
    })
    expect([...controls.keys()]).toEqual(['red'])
  })
})
