import type React from 'react'
import { useEffect, useRef } from 'react'

import type { SeatId } from '@parallax/protocol/identifiers'
import type { SeatSlot } from '@parallax/protocol/room'

import { alcoveInterior } from '@/features/alcove/alcove-bounds'
import { SHIPPED_ALCOVE } from '@/features/alcove/shipped-alcove'
import { prefersReducedMotion } from '@/infrastructure/browser'

import { createGlobeJudge, loadGlobeAtlas } from './globe-atlas'
import { createGlobeBots } from './globe-bots'
import { createGlobeMatch, type GlobeMatch } from './globe-match'
import { createGlobeRenderer } from './globe-renderer'
import { globeStand } from './globe-stand'
import { GLOBE_STEP_SECONDS, LONGEST_FRAME_SECONDS } from './globe-tuning'

import './globe-showcase.sass'

const STAND = globeStand(SHIPPED_ALCOVE, alcoveInterior(SHIPPED_ALCOVE))
const BOTS: SeatId[] = ['bot-0', 'bot-1', 'bot-2']
const SLOTS = new Map<SeatId, SeatSlot>(BOTS.map((bot, slot) => [bot, slot]))

/**
 * Terre playing by itself, for the game choice: three bots take turns
 * finding places on the globe. No room and no names. With reduced motion,
 * the globe stays still.
 */
export const GlobeShowcase: React.FC = () => {
  const host = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const element = host.current
    if (element === null) return
    const renderer = createGlobeRenderer(element, STAND)
    const slotOf = (seat: SeatId) => SLOTS.get(seat)
    let frame = 0
    let isMounted = true

    void loadGlobeAtlas().then((atlas) => {
      if (!isMounted) return
      renderer.paint(atlas)
      const judge = createGlobeJudge(atlas)
      const start = (): GlobeMatch =>
        createGlobeMatch({ judge, random: Math.random, seats: BOTS })
      let match = start()
      if (prefersReducedMotion()) {
        renderer.draw({ slotOf, view: match.view() }, 0)
        return
      }
      let bots = createGlobeBots(Math.random, judge)
      let pending = 0
      let previous: number | null = null
      frame = requestAnimationFrame(function step(time) {
        const seconds =
          previous === null
            ? 0
            : Math.min((time - previous) / 1000, LONGEST_FRAME_SECONDS)
        previous = time
        pending += seconds
        while (pending >= GLOBE_STEP_SECONDS) {
          pending -= GLOBE_STEP_SECONDS
          const input = bots(match, GLOBE_STEP_SECONDS)
          if (match.advance(input, GLOBE_STEP_SECONDS)) {
            match = start()
            bots = createGlobeBots(Math.random, judge)
          }
        }
        renderer.draw({ slotOf, view: match.view() }, seconds)
        frame = requestAnimationFrame(step)
      })
    })

    return () => {
      isMounted = false
      cancelAnimationFrame(frame)
      renderer.dispose()
    }
  }, [])

  return <div className='globe-showcase' ref={host} />
}
