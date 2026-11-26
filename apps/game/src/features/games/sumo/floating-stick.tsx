import type React from 'react'
import { useEffect, useEffectEvent, useRef, useState } from 'react'

import type { SeatSlot } from '@parallax/protocol/room'

import { SeatTop } from '@/features/room/seat-top'
import {
  lengthOf,
  ORIGIN,
  type PlanarVector,
  pointsOnCircle,
  subtracted
} from '@/helpers/planar-vector'

import { ARENA_PLAN } from './arena-plan'
import { KNOB_TRAVEL_SHARE, stickAnchor, stickReading } from './stick-geometry'
import { useKnobSpin } from './use-knob-spin'

import './floating-stick.sass'

/** The plan's outer filet sits 3 units inside the 200-unit box, so its stroke is never cut. */
const PLAN_SCALE = 97 / ARENA_PLAN.gutterEdge
const PLAN_CENTRE = 100
const PLAN_TICK_HALF_LENGTH = 6

const planRadius = (arenaRadius: number) => arenaRadius * PLAN_SCALE

const planTicks = pointsOnCircle({ count: ARENA_PLAN.ticks, radius: 1 }).map(
  (direction) => {
    const inner = planRadius(ARENA_PLAN.tickRadius) - PLAN_TICK_HALF_LENGTH
    const outer = planRadius(ARENA_PLAN.tickRadius) + PLAN_TICK_HALF_LENGTH

    return {
      key: `${direction.x.toFixed(3)},${direction.y.toFixed(3)}`,
      x1: PLAN_CENTRE + direction.x * inner,
      x2: PLAN_CENTRE + direction.x * outer,
      y1: PLAN_CENTRE + direction.y * inner,
      y2: PLAN_CENTRE + direction.y * outer
    }
  }
)

/** The arena's plan, at its proportions: gutter edge, rim, centre ring, ticks and spot. */
const StickPlan: React.FC = () => (
  <svg
    aria-hidden='true'
    className='stick-plan'
    fill='none'
    stroke='currentColor'
    viewBox='0 0 200 200'
  >
    <circle
      cx={PLAN_CENTRE}
      cy={PLAN_CENTRE}
      opacity='0.55'
      r={planRadius(ARENA_PLAN.gutterEdge)}
      strokeWidth='1.5'
    />
    <circle
      cx={PLAN_CENTRE}
      cy={PLAN_CENTRE}
      r={planRadius(ARENA_PLAN.rim)}
      strokeWidth='4'
    />
    <circle
      cx={PLAN_CENTRE}
      cy={PLAN_CENTRE}
      opacity='0.6'
      r={planRadius(ARENA_PLAN.centreRing)}
      strokeWidth='1.5'
    />
    <g opacity='0.8' strokeWidth='3'>
      {planTicks.map(({ key, ...line }) => (
        <line key={key} {...line} />
      ))}
    </g>
    <circle
      cx={PLAN_CENTRE}
      cy={PLAN_CENTRE}
      fill='currentColor'
      r={planRadius(ARENA_PLAN.centreSpot)}
      stroke='none'
    />
  </svg>
)

/**
 * The thumb in the stick's own frame. A pad turned a quarter clockwise
 * (`data-turned`, landscape on a phone held upright) has its x running down
 * the screen and its y running leftwards.
 */
const pointIn = (
  zone: HTMLElement,
  event: React.PointerEvent<HTMLElement>
): PlanarVector => {
  const box = zone.getBoundingClientRect()
  return zone.closest('[data-turned]') === null
    ? { x: event.clientX - box.left, y: event.clientY - box.top }
    : { x: event.clientY - box.top, y: box.right - event.clientX }
}

type FloatingStickProps = {
  /** Called with every move of the thumb, and `ORIGIN` when it lets go. */
  onStick: (stick: PlanarVector) => void
  slot: SeatSlot
}

/**
 * The left thumb's stick: its base, the arena's plan, jumps to where the
 * thumb lands and goes back to the centre when it lets go; its knob is the
 * player's own top, turning faster as it is pushed. A pad gone inert or a
 * hidden page never sends the thumb's `pointerup`: the stick lets go then too.
 */
export const FloatingStick: React.FC<FloatingStickProps> = ({
  onStick,
  slot
}) => {
  const zoneRef = useRef<HTMLDivElement>(null)
  const baseRef = useRef<HTMLDivElement>(null)
  const knobRef = useRef<HTMLDivElement>(null)
  const heldPointerRef = useRef<number | null>(null)
  const grabRef = useRef({ anchor: ORIGIN, travel: 0 })
  const stickLengthRef = useRef(0)
  const [anchor, setAnchor] = useState<PlanarVector | null>(null)

  useKnobSpin({ knob: knobRef, stickLength: stickLengthRef })

  const showKnob = (knob: PlanarVector) => {
    knobRef.current?.style.setProperty('--knob-x-px', `${knob.x}px`)
    knobRef.current?.style.setProperty('--knob-y-px', `${knob.y}px`)
  }

  const follow = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerId !== heldPointerRef.current) {
      return
    }

    const { anchor: grabbedAt, travel } = grabRef.current
    const reading = stickReading({
      offset: subtracted(pointIn(event.currentTarget, event), grabbedAt),
      travel
    })
    showKnob(reading.knob)
    stickLengthRef.current = lengthOf(reading.stick)
    onStick(reading.stick)
  }

  const release = () => {
    if (heldPointerRef.current === null) {
      return
    }

    heldPointerRef.current = null
    stickLengthRef.current = 0
    showKnob(ORIGIN)
    setAnchor(null)
    onStick(ORIGIN)
  }

  const releaseOutsideTheThumb = useEffectEvent(release)

  useEffect(() => {
    const releaseOnceInert = () => {
      if (zoneRef.current?.closest('[inert]')) {
        releaseOutsideTheThumb()
      }
    }
    const releaseOnceHidden = () => {
      if (document.hidden) {
        releaseOutsideTheThumb()
      }
    }
    const inertWatch = new MutationObserver(releaseOnceInert)

    inertWatch.observe(document.body, {
      attributeFilter: ['inert'],
      subtree: true
    })
    document.addEventListener('visibilitychange', releaseOnceHidden)

    return () => {
      inertWatch.disconnect()
      document.removeEventListener('visibilitychange', releaseOnceHidden)
    }
  }, [])

  const grab = (event: React.PointerEvent<HTMLDivElement>) => {
    const zone = event.currentTarget
    const heldPointer = heldPointerRef.current

    if (heldPointer !== null && zone.hasPointerCapture(heldPointer)) {
      return
    }

    release()

    const baseRadius = (baseRef.current?.offsetWidth ?? 0) / 2
    const grabbedAt = stickAnchor({
      baseRadius,
      pad: { height: zone.clientHeight, width: zone.clientWidth },
      point: pointIn(zone, event)
    })

    zone.setPointerCapture(event.pointerId)
    heldPointerRef.current = event.pointerId
    grabRef.current = {
      anchor: grabbedAt,
      travel: baseRadius * KNOB_TRAVEL_SHARE
    }
    setAnchor(grabbedAt)
    follow(event)
  }

  const letGo = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerId === heldPointerRef.current) {
      release()
    }
  }

  return (
    <div
      className='floating-stick'
      data-held={anchor !== null || undefined}
      onLostPointerCapture={letGo}
      onPointerCancel={letGo}
      onPointerDown={grab}
      onPointerMove={follow}
      onPointerUp={letGo}
      ref={zoneRef}
    >
      <div
        className='stick-base'
        ref={baseRef}
        style={
          anchor === null
            ? undefined
            : {
                '--anchor-x-px': `${anchor.x}px`,
                '--anchor-y-px': `${anchor.y}px`
              }
        }
      >
        <StickPlan />
        <div className='stick-knob' ref={knobRef}>
          <SeatTop className='knob-top' slot={slot} />
        </div>
      </div>
    </div>
  )
}
