import type React from 'react'
import { useEffect, useRef } from 'react'

import type { SeatId } from '@parallax/protocol/identifiers'
import type { SeatSlot } from '@parallax/protocol/room'

import { alcoveInterior } from '@/features/alcove/alcove-bounds'
import { SHIPPED_ALCOVE } from '@/features/alcove/shipped-alcove'
import { prefersReducedMotion } from '@/infrastructure/browser'

import { createClawBots } from './claw-bots'
import { type ClawMatch, createClawMatch } from './claw-match'
import { clawPit } from './claw-pit'
import { createClawRenderer } from './claw-renderer'
import { CLAW_STEP_SECONDS, LONGEST_FRAME_SECONDS } from './claw-tuning'

import './claw-showcase.sass'

const PIT = clawPit(SHIPPED_ALCOVE, alcoveInterior(SHIPPED_ALCOVE))
const BOTS: SeatId[] = ['bot-0', 'bot-1', 'bot-2', 'bot-3']
const SLOTS = new Map<SeatId, SeatSlot>(BOTS.map((bot, slot) => [bot, slot]))
const ALL = new Set(BOTS)

/**
 * The claw machine playing by itself, for the game choice: four bots fish in
 * the pile round after round. No room and no names. With reduced motion, the
 * claws hang still over the pile.
 */
export const ClawShowcase: React.FC = () => {
  const host = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const element = host.current
    if (element === null) return
    const renderer = createClawRenderer(element, PIT)
    const start = (): ClawMatch =>
      createClawMatch({ pit: PIT, random: Math.random, seats: BOTS })
    let match = start()
    const slotOf = (seat: SeatId) => SLOTS.get(seat)

    if (prefersReducedMotion()) {
      renderer.draw({ slotOf, view: match.view() }, 0)
      return () => renderer.dispose()
    }

    let bots = createClawBots(Math.random, PIT)
    let pending = 0
    let previous: number | null = null
    let frame = requestAnimationFrame(function step(time) {
      const seconds =
        previous === null
          ? 0
          : Math.min((time - previous) / 1000, LONGEST_FRAME_SECONDS)
      previous = time
      pending += seconds
      while (pending >= CLAW_STEP_SECONDS) {
        pending -= CLAW_STEP_SECONDS
        const { drops, sticks } = bots(match, CLAW_STEP_SECONDS)
        if (match.advance({ drops, seated: ALL, sticks })) {
          match = start()
          bots = createClawBots(Math.random, PIT)
        }
      }
      renderer.draw({ slotOf, view: match.view() }, seconds)
      frame = requestAnimationFrame(step)
    })

    return () => {
      cancelAnimationFrame(frame)
      renderer.dispose()
    }
  }, [])

  return <div className='claw-showcase' ref={host} />
}
