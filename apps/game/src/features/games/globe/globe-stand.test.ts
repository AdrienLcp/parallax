import { describe, expect, it } from 'vitest'

import { alcoveInterior } from '@/features/alcove/alcove-bounds'
import { SHIPPED_ALCOVE } from '@/features/alcove/shipped-alcove'

import { globeStand } from './globe-stand'

const interior = alcoveInterior(SHIPPED_ALCOVE)
const stand = globeStand(SHIPPED_ALCOVE, interior)
const { centre, facing, loupeGap, loupeRadius, radius } = stand

describe('globeStand', () => {
  it('keeps the globe inside the alcove, clear of the floor', () => {
    expect(centre.x - radius).toBeGreaterThan(interior.x.min)
    expect(centre.x + radius).toBeLessThan(interior.x.max)
    expect(centre.z - radius).toBeGreaterThan(interior.z.min)
    expect(centre.z + radius).toBeLessThan(interior.z.max)
    expect(centre.y - radius).toBeGreaterThan(0.12)
  })

  it('floats the loupe in front of the globe, inside the opening', () => {
    const loupeZ = centre.z + facing.z * (radius + loupeGap)
    const loupeX = centre.x + facing.x * (radius + loupeGap)
    expect(loupeZ + loupeRadius * Math.abs(facing.y)).toBeLessThan(
      interior.z.max
    )
    expect(Math.abs(loupeX) + loupeRadius).toBeLessThan(interior.x.max)
  })
})
