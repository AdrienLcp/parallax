import type React from 'react'
import { useEffect, useRef } from 'react'

import { useDisplayTuning } from '@/features/display-tuning/display-tuning-store'
import { prefersReducedMotion } from '@/infrastructure/browser'

import {
  type ArenaMotion,
  type ArenaOrbit,
  advanceOrbit,
  STILL_ORBIT
} from './arena-orbit'
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
  const draw = () => renderer.draw(still, 0, 0)
  const resizing = new ResizeObserver(draw)
  resizing.observe(host)
  draw()
  return () => resizing.disconnect()
}

/**
 * Steps the showcase at the sumo's fixed rate and draws it on every display
 * frame, the camera moving as it does while a room waits: the demo is no match.
 */
const playOn = (renderer: ArenaRenderer, motionNow: () => ArenaMotion) => {
  let play: ShowcasePlay = startShowcase()
  let orbit: ArenaOrbit = STILL_ORBIT
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
    orbit = advanceOrbit(orbit, {
      motion: motionNow(),
      seconds,
      stage: 'waiting'
    })
    renderer.draw(showcaseFrameOf(play), seconds, orbit.azimuth)
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
  const { arena } = useDisplayTuning()
  const currentArena = useRef(arena)
  const renderer = useRef<ArenaRenderer | null>(null)

  useEffect(() => {
    const element = host.current
    if (element === null) {
      return
    }

    const created = createFlatPortraitRenderer(
      element,
      currentArena.current,
      'framed'
    )
    renderer.current = created
    const stop = prefersReducedMotion()
      ? standStill(element, created)
      : playOn(created, () => currentArena.current.motion)

    return () => {
      stop()
      created.dispose()
      renderer.current = null
    }
  }, [])

  useEffect(() => {
    currentArena.current = arena
    renderer.current?.tune(arena)
  }, [arena])

  return <div className='sumo-showcase' ref={host} />
}
