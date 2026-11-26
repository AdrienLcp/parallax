import { DirectionalLight, ShaderChunk } from 'three'
import { describe, expect, it } from 'vitest'

import {
  LAMP_ANGLE,
  softenShadow,
  softenShadowLookup
} from './alcove-soft-shadows'

const BASIC_LOOKUP = 'float getShadow( sampler2D shadowMap'

describe('softenShadowLookup', () => {
  const original = ShaderChunk.shadowmap_pars_fragment
  const softened = softenShadowLookup(original)

  it("replaces three's BASIC lookup and keeps the other shadow types", () => {
    expect(softened).toContain('blockerDepth')
    expect(softened.split(BASIC_LOOKUP)).toHaveLength(
      original.split(BASIC_LOOKUP).length
    )
    expect(softened).toContain('sampler2DShadow')
    expect(softened.split('{').length).toBe(softened.split('}').length)
  })

  it('leaves a chunk it already softened as it is', () => {
    expect(softenShadowLookup(softened)).toBe(softened)
  })

  it('says so when the chunk no longer has the lookup', () => {
    expect(() => softenShadowLookup('void main() {}')).toThrow(/no longer fits/)
  })
})

describe('softenShadow', () => {
  it("spreads a light's shadow by the lamp's angle over its shadow box", () => {
    const light = new DirectionalLight()
    Object.assign(light.shadow.camera, {
      far: 9,
      left: -1.1,
      near: 1,
      right: 1.1
    })
    softenShadow(light)
    expect(light.shadow.radius).toBeCloseTo((8 * LAMP_ANGLE) / 2.2, 9)
  })
})
