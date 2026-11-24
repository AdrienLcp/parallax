import type { SeatSlot } from '@parallax/protocol/room'

/** One shown tag, in CSS pixels: where its stem meets its top, and its plate's and resting stem's sizes. */
export type TagBox = {
  readonly plateHeight: number
  readonly plateWidth: number
  readonly slot: SeatSlot
  readonly stemHeight: number
  readonly x: number
  readonly y: number
}

type PlacedPlate = {
  readonly bottom: number
  readonly top: number
  readonly width: number
  readonly x: number
}

/**
 * How far each tag's plate climbs over its resting place, in CSS pixels, so
 * no two plates overlap: the nearest top, lowest on the canvas, keeps its tag
 * low, and a farther one climbs above any plate it would cover, its stem
 * lengthening by the same amount to stay on its top.
 */
export const liftTagsApart = (
  tags: readonly TagBox[],
  gap: number
): ReadonlyMap<SeatSlot, number> => {
  const lifts = new Map<SeatSlot, number>()
  const placed: PlacedPlate[] = []
  for (const tag of [...tags].sort((one, other) => other.y - one.y)) {
    const resting = tag.y - tag.stemHeight
    let bottom = resting
    let hasMoved = true
    while (hasMoved) {
      hasMoved = false
      for (const plate of placed) {
        const isApart =
          Math.abs(tag.x - plate.x) >= (tag.plateWidth + plate.width) / 2 + gap
        const isAbove = bottom <= plate.top - gap
        const isBelow = bottom - tag.plateHeight >= plate.bottom + gap
        if (isApart || isAbove || isBelow) continue
        bottom = plate.top - gap
        hasMoved = true
      }
    }
    placed.push({
      bottom,
      top: bottom - tag.plateHeight,
      width: tag.plateWidth,
      x: tag.x
    })
    lifts.set(tag.slot, resting - bottom)
  }
  return lifts
}
