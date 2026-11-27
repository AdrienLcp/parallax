import type React from 'react'

import { ROOM_SEAT_LIMIT } from '@parallax/protocol/room'

import { alcoveShelf } from '@/features/alcove/alcove-shelf'
import { DISPLAY_ASPECT } from '@/features/alcove/display-aspect'
import { projectInAlcove } from '@/features/alcove/project-in-alcove'
import { SHIPPED_ALCOVE } from '@/features/alcove/shipped-alcove'

/**
 * A rectangle of the room's lettering laid flat in a plane facing the
 * players: `x` across in alcove units, `y` as shares of the alcove's height,
 * `z` its depth (the back wall when left out).
 */
type WallRect = {
  readonly bottom: number
  readonly left: number
  readonly right: number
  readonly top: number
  readonly z?: number
}

/** Where the room's pieces hang on the back wall, under the roof and over the shelf. */
const WALL = {
  /** The cues, painted in one line just over the shelf. */
  cues: { bottom: 0.682, left: -0.42, right: 0.42, top: 0.728 },
  /** The QR card, hung at the top left. */
  qr: { bottom: 0.738, left: -0.44, right: -0.1, top: 0.963 },
  /** The title and the room's plaque, painted at the top right. */
  title: { bottom: 0.77, left: -0.04, right: 0.44, top: 0.957 }
} as const satisfies Record<string, WallRect>

/** Each seat's plaque standing on the shelf: its width, its height, and the step from one to the next, in alcove units. */
const PLAQUE = { height: 0.156, step: 0.147, width: 0.13 } as const

/**
 * Where `rect` shows on the display, as the CSS custom properties a wall piece
 * reads (`--wall-left`, `--wall-top`, `--wall-width`, `--wall-height`), shares
 * of the display frame, and `--wall-unit`, 1 % of the piece's width, which
 * sizes what it holds. The pieces face the players, so a rectangle stays one.
 */
const wallStyle = ({ bottom, left, right, top, z }: WallRect) => {
  const { depth, height } = SHIPPED_ALCOVE
  const plane = z ?? -depth
  const topLeft = projectInAlcove(SHIPPED_ALCOVE, {
    x: left,
    y: top * height,
    z: plane
  })
  const bottomRight = projectInAlcove(SHIPPED_ALCOVE, {
    x: right,
    y: bottom * height,
    z: plane
  })
  return {
    '--wall-height': `${(bottomRight.y - topLeft.y) * 100}%`,
    '--wall-left': `${topLeft.x * 100}%`,
    '--wall-top': `${topLeft.y * 100}%`,
    '--wall-unit': `calc(var(--display-cu) * ${((bottomRight.x - topLeft.x) * DISPLAY_ASPECT * 100) / 100})`,
    '--wall-width': `${(bottomRight.x - topLeft.x) * 100}%`
  } satisfies React.CSSProperties
}

/** The pieces of the room on the back wall, each as its place on the display. */
export const WALL_STYLE = {
  cues: wallStyle(WALL.cues),
  qr: wallStyle(WALL.qr),
  title: wallStyle(WALL.title)
}

const shelf = alcoveShelf(SHIPPED_ALCOVE)
const firstPlaqueLeft =
  -((ROOM_SEAT_LIMIT - 1) * PLAQUE.step + PLAQUE.width) / 2

/** The shelf's soft shadow on the back wall, just under its plank. */
export const SHELF_SHADOW_STYLE = wallStyle({
  bottom: (shelf.bottom - 0.07) / SHIPPED_ALCOVE.height,
  left: -shelf.halfWidth,
  right: shelf.halfWidth,
  top: shelf.bottom / SHIPPED_ALCOVE.height
})

/** Each seat's plaque on the shelf, by slot, as its place on the display. */
export const PLAQUE_STYLES = Array.from(
  { length: ROOM_SEAT_LIMIT },
  (_, slot) => {
    const left = firstPlaqueLeft + slot * PLAQUE.step
    return wallStyle({
      bottom: shelf.top / SHIPPED_ALCOVE.height,
      left,
      right: left + PLAQUE.width,
      top: (shelf.top + PLAQUE.height) / SHIPPED_ALCOVE.height,
      z: shelf.middleZ
    })
  }
)
