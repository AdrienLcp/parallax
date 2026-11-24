import { describe, expect, it } from 'vitest'

import { liftTagsApart, type TagBox } from './tag-placement'

const GAP = 4

const tagAt = (
  slot: TagBox['slot'],
  { x, y }: { x: number; y: number }
): TagBox => ({
  plateHeight: 30,
  plateWidth: 100,
  slot,
  stemHeight: 12,
  x,
  y
})

describe('liftTagsApart', () => {
  it('leaves tags far apart at rest', () => {
    const lifts = liftTagsApart(
      [tagAt(0, { x: 100, y: 300 }), tagAt(1, { x: 400, y: 300 })],
      GAP
    )
    expect(lifts.get(0)).toBe(0)
    expect(lifts.get(1)).toBe(0)
  })

  it('keeps the nearest top’s tag low and lifts the farther one just above it', () => {
    const lifts = liftTagsApart(
      [tagAt(0, { x: 120, y: 280 }), tagAt(1, { x: 100, y: 300 })],
      GAP
    )
    expect(lifts.get(1)).toBe(0)
    const nearPlateTop = 300 - 12 - 30
    expect(280 - 12 - (lifts.get(0) ?? 0)).toBe(nearPlateTop - GAP)
  })

  it('stacks a third tag over both plates it would cover', () => {
    const lifts = liftTagsApart(
      [
        tagAt(0, { x: 100, y: 300 }),
        tagAt(1, { x: 110, y: 290 }),
        tagAt(2, { x: 90, y: 280 })
      ],
      GAP
    )
    const plateBottomOf = (slot: TagBox['slot'], y: number) =>
      y - 12 - (lifts.get(slot) ?? 0)
    expect([
      plateBottomOf(0, 300),
      plateBottomOf(1, 290),
      plateBottomOf(2, 280)
    ]).toEqual([288, 254, 220])
  })

  it('lets a tag that clears another sideways stay at rest', () => {
    const lifts = liftTagsApart(
      [tagAt(0, { x: 100, y: 300 }), tagAt(1, { x: 205, y: 290 })],
      GAP
    )
    expect(lifts.get(1)).toBe(0)
  })
})
