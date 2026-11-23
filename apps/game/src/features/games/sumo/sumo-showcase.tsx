import type React from 'react'
import { useEffect, useRef } from 'react'

import { prefersReducedMotion } from '@/infrastructure/browser'

import type { ArenaRenderer } from './arena-renderer'
import { createFlatPortraitRenderer } from './flat-portrait-renderer'
import {
  advanceShowcase,
  type ShowcasePlay,
  showcaseFrameOf,
  startShowcase
} from './showcase-play'
import { LONGEST_FRAME_SECONDS, SUMO_STEP_SECONDS } from './sumo-tuning'

import './sumo-showcase.sass'

/** Draws the demo tops on their marks, again whenever the host is resized. */
const standStill = (host: HTMLElement, renderer: ArenaRenderer) => {
  const still = showcaseFrameOf(startShowcase())
  const draw = () => renderer.draw(still, 0)
  const resizing = new ResizeObserver(draw)
  resizing.observe(host)
  draw()
  return () => resizing.disconnect()
}

/** Steps the showcase at the sumo's fixed rate and draws it on every display frame. */
const playOn = (renderer: ArenaRenderer) => {
  let play: ShowcasePlay = startShowcase()
  let pendingSeconds = 0
  let previousTime: number | null = null
  let frame = requestAnimationFrame(function step(time) {
    const seconds =
      previousTime === null
        ? 0
        : Math.min((time - previousTime) / 1000, LONGEST_FRAME_SECONDS)
    previousTime = time
    pendingSeconds += seconds
    while (pendingSeconds >= SUMO_STEP_SECONDS) {
      pendingSeconds -= SUMO_STEP_SECONDS
      play = advanceShowcase(play, {
        random: Math.random,
        seconds: SUMO_STEP_SECONDS
      })
    }
    renderer.draw(showcaseFrameOf(play), seconds)
    frame = requestAnimationFrame(step)
  })
  return () => cancelAnimationFrame(frame)
}

/**
 * The sumo playing by itself, for the game choice: the real arena and its
 * lacquered tops, driven by bots, round after round. No room and no names:
 * the demo tops are nobody's. With reduced motion, the tops wait on their marks.
 */
export const SumoShowcase: React.FC = () => {
  const host = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const element = host.current
    if (element === null) {
      return
    }

    const renderer = createFlatPortraitRenderer(element)
    const stop = prefersReducedMotion()
      ? standStill(element, renderer)
      : playOn(renderer)

    return () => {
      stop()
      renderer.dispose()
    }
  }, [])

  return <div className='sumo-showcase' ref={host} />
}
