import { describe, expect, it } from 'vitest'

import { lengthOf, ORIGIN } from '@/helpers/planar-vector'

import { collided, type SpinningTop, stepTops, type Top } from './sumo-physics'
import { SUMO_STEP_SECONDS, SUMO_TUNING } from './sumo-tuning'

const spinningTop = (overrides: Partial<SpinningTop> = {}): SpinningTop => ({
  dashCooldown: 0,
  lastContact: null,
  position: ORIGIN,
  seat: 'red',
  status: 'spinning',
  velocity: ORIGIN,
  ...overrides
})

const idle = {
  controls: new Map(),
  dashes: new Set<string>(),
  seconds: SUMO_STEP_SECONDS
}

const stepped = (
  tops: readonly Top[],
  input: Partial<typeof idle> = {},
  steps = 1
): readonly Top[] =>
  Array.from({ length: steps }).reduce<readonly Top[]>(
    (current) => stepTops({ ...idle, ...input, tops: current }),
    tops
  )

describe('sumo physics', () => {
  it('[sumo] a pushed stick accelerates the top that way', () => {
    const [top] = stepped(
      [spinningTop()],
      {
        controls: new Map([['red', { stick: { x: 1, y: 0 } }]])
      },
      30
    )
    expect(top?.position.x).toBeGreaterThan(0)
    expect(top?.position.y).toBeCloseTo(0)
  })

  it('[sumo] driving alone never exceeds the drive speed', () => {
    const [top] = stepped(
      [spinningTop({ position: { x: -0.9, y: 0 } })],
      {
        controls: new Map([['red', { stick: { x: 1, y: 0 } }]])
      },
      60
    )
    expect(top?.status).toBe('spinning')
    if (top?.status !== 'spinning') return
    expect(lengthOf(top.velocity)).toBeLessThanOrEqual(
      SUMO_TUNING.maximumDriveSpeed
    )
  })

  it('[sumo] friction brings a released top to rest', () => {
    const [top] = stepped(
      [spinningTop({ velocity: { x: 0.3, y: 0 } })],
      {},
      600
    )
    if (top?.status !== 'spinning') throw new Error('the top should still spin')
    expect(lengthOf(top.velocity)).toBeLessThan(0.001)
  })

  it('[sumo] a dash is refused while it cools down', () => {
    const dashing = { dashes: new Set(['red']) }
    const [afterFirst] = stepped([spinningTop()], {
      ...dashing,
      controls: new Map([['red', { stick: { x: 0, y: 1 } }]])
    })
    if (afterFirst?.status !== 'spinning')
      throw new Error('the top should still spin')
    const [afterSecond] = stepped([afterFirst], dashing)
    if (afterSecond?.status !== 'spinning')
      throw new Error('the top should still spin')
    expect(afterFirst.dashCooldown).toBeGreaterThan(0)
    expect(lengthOf(afterSecond.velocity)).toBeLessThan(
      lengthOf(afterFirst.velocity)
    )
  })

  it('[sumo] a head-on hit hands the momentum to the top that was hit', () => {
    const [striker, struck] = collided({
      first: spinningTop({ velocity: { x: 1, y: 0 } }),
      second: spinningTop({
        position: { x: SUMO_TUNING.topRadius * 1.5, y: 0 },
        seat: 'blue'
      })
    })
    expect(struck.velocity.x).toBeGreaterThan(striker.velocity.x)
    expect(struck.velocity.x).toBeGreaterThan(0.9)
  })

  it('[sumo] tops moving apart only get separated', () => {
    const [left, right] = collided({
      first: spinningTop({ velocity: { x: -1, y: 0 } }),
      second: spinningTop({
        position: { x: SUMO_TUNING.topRadius, y: 0 },
        seat: 'blue'
      })
    })
    expect(left.velocity.x).toBe(-1)
    expect(right.position.x - left.position.x).toBeCloseTo(
      SUMO_TUNING.topRadius * 2
    )
  })

  it('[sumo] a top past the edge falls, then is out', () => {
    const edge = spinningTop({
      position: { x: SUMO_TUNING.arenaRadius - 0.001, y: 0 },
      velocity: { x: 0.5, y: 0 }
    })
    const [falling] = stepped([edge])
    expect(falling?.status).toBe('falling')
    const fallSteps = Math.ceil(SUMO_TUNING.fallSeconds / SUMO_STEP_SECONDS) + 1
    const [out] = stepped([edge], {}, fallSteps)
    expect(out?.status).toBe('out')
  })

  it('[sumo] a top pushed off is credited to the last top it touched', () => {
    const fallSteps = Math.ceil(SUMO_TUNING.fallSeconds / SUMO_STEP_SECONDS) + 1
    const [, struck] = stepped(
      [
        spinningTop({
          position: { x: SUMO_TUNING.arenaRadius - 0.3, y: 0 },
          velocity: { x: 1.5, y: 0 }
        }),
        spinningTop({
          position: {
            x: SUMO_TUNING.arenaRadius - 0.3 + SUMO_TUNING.topRadius * 1.9,
            y: 0
          },
          seat: 'blue'
        })
      ],
      {},
      fallSteps + 30
    )
    expect(struck).toMatchObject({ outBy: 'red', status: 'out' })
  })

  it('[sumo] a top that drives itself off long after its last contact is credited to no one', () => {
    const [falling] = stepped([
      spinningTop({
        lastContact: {
          seat: 'blue',
          since: SUMO_TUNING.pushCreditSeconds + 0.1
        },
        position: { x: SUMO_TUNING.arenaRadius - 0.001, y: 0 },
        velocity: { x: 0.5, y: 0 }
      })
    ])
    expect(falling).toMatchObject({ outBy: null, status: 'falling' })
  })
})
