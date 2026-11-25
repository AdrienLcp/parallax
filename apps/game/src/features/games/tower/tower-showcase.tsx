import type React from 'react'
import { useEffect, useRef } from 'react'

import type { SeatId } from '@parallax/protocol/identifiers'
import type { SeatSlot } from '@parallax/protocol/room'

import { alcoveInterior } from '@/features/alcove/alcove-bounds'
import { SHIPPED_ALCOVE } from '@/features/alcove/shipped-alcove'
import { prefersReducedMotion } from '@/infrastructure/browser'

import { loadRapier } from './load-rapier'
import { createTowerBots } from './tower-bots'
import { createTowerMatch, type TowerMatch } from './tower-match'
import { createTowerPhysics, type Rapier } from './tower-physics'
import { createTowerRenderer } from './tower-renderer'
import { LONGEST_FRAME_SECONDS, TOWER_STEP_SECONDS } from './tower-tuning'

import './tower-showcase.sass'

const INTERIOR = alcoveInterior(SHIPPED_ALCOVE)
const BOTS: SeatId[] = ['bot-0', 'bot-1', 'bot-2']
const SLOTS = new Map<SeatId, SeatSlot>(BOTS.map((bot, slot) => [bot, slot]))
const ALL = new Set(BOTS)

/**
 * The tower building itself, for the game choice: three bots take turns on
 * the shared tower until it falls, then start again. No room and no names.
 * With reduced motion, the empty alcove waits.
 */
export const TowerShowcase: React.FC = () => {
  const host = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const element = host.current
    if (element === null) return
    const renderer = createTowerRenderer(element, INTERIOR)
    let isGone = false
    let frame = 0

    const play = (rapier: Rapier) => {
      let physics = createTowerPhysics(rapier, INTERIOR)
      const start = (): TowerMatch =>
        createTowerMatch({
          interior: INTERIOR,
          physics,
          random: Math.random,
          rule: 'shared',
          seats: BOTS
        })
      let match = start()
      let bots = createTowerBots(Math.random)
      let pending = 0
      let previous: number | null = null
      frame = requestAnimationFrame(function step(time) {
        const seconds =
          previous === null
            ? 0
            : Math.min((time - previous) / 1000, LONGEST_FRAME_SECONDS)
        previous = time
        pending += seconds
        while (pending >= TOWER_STEP_SECONDS) {
          pending -= TOWER_STEP_SECONDS
          const { aims, drops } = bots(match)
          if (match.advance({ aims, drops, present: ALL, seated: ALL })) {
            physics.dispose()
            physics = createTowerPhysics(rapier, INTERIOR)
            match = start()
            bots = createTowerBots(Math.random)
          }
        }
        const view = match.view()
        renderer.draw(
          {
            landings: view.lanes.map((lane) => match.landingOf(lane)),
            poseOf: match.poseOf,
            slotOf: (seat) => SLOTS.get(seat),
            view
          },
          seconds
        )
        frame = requestAnimationFrame(step)
      })
      return () => physics.dispose()
    }

    let stop: (() => void) | null = null
    if (prefersReducedMotion()) {
      renderer.draw(
        {
          landings: [],
          poseOf: () => ({
            position: { x: 0, y: 0, z: 0 },
            quaternion: { w: 1, x: 0, y: 0, z: 0 }
          }),
          slotOf: () => undefined,
          view: { elapsed: 0, lanes: [], outcome: null, rule: 'shared' }
        },
        0
      )
    } else {
      void loadRapier().then((rapier) => {
        if (!isGone) stop = play(rapier)
      })
    }

    return () => {
      isGone = true
      cancelAnimationFrame(frame)
      stop?.()
      renderer.dispose()
    }
  }, [])

  return <div className='tower-showcase' ref={host} />
}
