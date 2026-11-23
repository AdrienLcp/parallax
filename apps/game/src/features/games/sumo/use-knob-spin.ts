import { type RefObject, useEffect } from 'react'

import { prefersReducedMotion } from '@/infrastructure/browser'

import { knobTurnsPerSecond } from './stick-geometry'

/** A frame that comes late (a hidden tab, a stall) turns the top no further than this. */
const LONGEST_FRAME_SECONDS = 0.05

/**
 * Turns the knob's top every frame, faster as the stick is pushed, by writing
 * `--knob-turn` on `knob`. Still under reduced motion.
 */
export const useKnobSpin = ({
  knob,
  stickLength
}: {
  knob: RefObject<HTMLElement | null>
  stickLength: RefObject<number>
}): void => {
  useEffect(() => {
    if (prefersReducedMotion()) {
      return
    }

    let turn = 0
    let previousFrameMs = performance.now()
    let frame = 0

    const step = (frameMs: number) => {
      const seconds = Math.min(
        LONGEST_FRAME_SECONDS,
        (frameMs - previousFrameMs) / 1000
      )
      previousFrameMs = frameMs
      turn = (turn + seconds * knobTurnsPerSecond(stickLength.current)) % 1
      knob.current?.style.setProperty('--knob-turn', `${turn}turn`)
      frame = requestAnimationFrame(step)
    }

    frame = requestAnimationFrame(step)

    return () => cancelAnimationFrame(frame)
  }, [knob, stickLength])
}
