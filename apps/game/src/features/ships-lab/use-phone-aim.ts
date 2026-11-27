import { useEffect, useRef, useState } from 'react'

import type { PlanarVector } from '@/helpers/planar-vector'

/** A quarter turn of the phone swings the nose half a turn: aiming behind the ship needs no twisted wrist. */
const YAW_GAIN = 2
const PITCH_GAIN = 1.5
const PITCH_SPAN = (80 * Math.PI) / 180

type Heading = { elevation: number; heading: number }

export type PhoneAimStatus = 'denied' | 'idle' | 'live' | 'unsupported'

const toRadians = (degrees: number) => (degrees * Math.PI) / 180

const wrap = (angle: number) =>
  ((((angle + Math.PI) % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)) -
  Math.PI

const clampUnit = (value: number) => Math.min(1, Math.max(-1, value))

/** Hundredths are enough: the nose eases to the heading on the screen. */
const toWire = (value: number) => Math.round(clampUnit(value) * 100) / 100

/**
 * Where the phone's back points, in the Earth's frame of `deviceorientation`
 * (x east, y north, z up): the compass heading and the height above level.
 */
const backOf = (event: DeviceOrientationEvent): Heading | null => {
  if (event.alpha === null || event.beta === null || event.gamma === null) {
    return null
  }
  const alpha = toRadians(event.alpha)
  const beta = toRadians(event.beta)
  const gamma = toRadians(event.gamma)
  const x =
    -Math.sin(gamma) * Math.cos(alpha) -
    Math.cos(gamma) * Math.sin(beta) * Math.sin(alpha)
  const y =
    -Math.sin(gamma) * Math.sin(alpha) +
    Math.cos(gamma) * Math.sin(beta) * Math.cos(alpha)
  const z = -Math.cos(gamma) * Math.cos(beta)
  return {
    elevation: Math.asin(Math.max(-1, Math.min(1, z))),
    heading: Math.atan2(x, y)
  }
}

/**
 * The phone as a pointer: held like a camera at the display, where its back
 * points becomes the ship's heading, sent as a stick (`x` the turn, a full
 * half-turn at ±1; `y` the height, growing downwards like a stick's). The
 * first reading, and each `recenter`, takes the phone's direction as
 * straight into the alcove.
 */
export const usePhoneAim = (onAim: (aim: PlanarVector) => void) => {
  const [status, setStatus] = useState<PhoneAimStatus>('idle')
  const centreRef = useRef<Heading | null>(null)
  const lastRef = useRef<Heading | null>(null)
  const onAimRef = useRef(onAim)
  onAimRef.current = onAim

  useEffect(() => {
    if (status !== 'live') return
    const listen = (event: DeviceOrientationEvent) => {
      const back = backOf(event)
      if (back === null) return
      lastRef.current = back
      centreRef.current ??= back
      const centre = centreRef.current
      const yaw = wrap(back.heading - centre.heading) * YAW_GAIN
      const pitch = (back.elevation - centre.elevation) * PITCH_GAIN
      onAimRef.current({
        x: toWire(yaw / Math.PI),
        y: toWire(-pitch / PITCH_SPAN)
      })
    }
    window.addEventListener('deviceorientation', listen)
    return () => window.removeEventListener('deviceorientation', listen)
  }, [status])

  /** Asks for the sensor (iOS wants a tap) and takes the phone's direction as straight in. */
  const recenter = async () => {
    centreRef.current = lastRef.current
    if (status === 'live') return
    if (typeof DeviceOrientationEvent === 'undefined') {
      setStatus('unsupported')
      return
    }
    // iOS asks before it shares the sensor; the others share it at once.
    const ask =
      'requestPermission' in DeviceOrientationEvent
        ? DeviceOrientationEvent.requestPermission
        : undefined
    if (typeof ask === 'function') {
      const answer: unknown = await Promise.resolve(
        ask.call(DeviceOrientationEvent)
      ).catch(() => 'denied')
      if (answer !== 'granted') {
        setStatus('denied')
        return
      }
    }
    setStatus('live')
  }

  return { recenter, status }
}
