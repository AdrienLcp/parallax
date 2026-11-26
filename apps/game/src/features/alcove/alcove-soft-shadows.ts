import {
  BasicShadowMap,
  type DirectionalLight,
  ShaderChunk,
  type WebGLRenderer
} from 'three'

/**
 * How wide the lamp looks from what it lights, in radians: a shadow's blurred
 * edge is `distance to the surface * LAMP_ANGLE` wide. Picked on the claw mocks
 * on 2026-11-26.
 */
export const LAMP_ANGLE = 0.16

/** Share of the shadow camera's depth the blocker search covers: the alcove's height is about a quarter of it. */
const SEARCH_DEPTH = 0.2

/**
 * Percentage-closer soft shadows in place of three's BASIC lookup: a blocker
 * search finds how far the shadow's caster stands from the receiving surface,
 * then a disc of that width is averaged. `shadowRadius` carries the light's
 * spread in shadow-map UV per unit of normalised depth (`softenShadow` sets it).
 * Only orthographic (directional) shadow cameras keep depth linear, as this
 * needs.
 */
const SOFT_SHADOW = /* glsl */ `
float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
  shadowCoord.xyz /= shadowCoord.w;
  shadowCoord.z += shadowBias;
  if ( shadowCoord.x < 0.0 || shadowCoord.x > 1.0 || shadowCoord.y < 0.0 || shadowCoord.y > 1.0 || shadowCoord.z > 1.0 ) return 1.0;
  float spin = 6.2831853 * fract( 52.9829189 * fract( dot( gl_FragCoord.xy, vec2( 0.06711056, 0.00583715 ) ) ) );
  mat2 turn = mat2( cos( spin ), sin( spin ), -sin( spin ), cos( spin ) );
  float search = shadowRadius * ${SEARCH_DEPTH.toFixed(2)};
  float blockers = 0.0;
  float blockerDepth = 0.0;
  for ( int i = 0; i < 16; i ++ ) {
    float r = sqrt( ( float( i ) + 0.5 ) / 16.0 );
    float a = float( i ) * 2.3999632;
    float depth = textureLod( shadowMap, shadowCoord.xy + turn * vec2( cos( a ), sin( a ) ) * r * search, 0.0 ).r;
    if ( depth < shadowCoord.z ) { blockers += 1.0; blockerDepth += depth; }
  }
  if ( blockers == 0.0 ) return 1.0;
  blockerDepth /= blockers;
  float penumbra = max( ( shadowCoord.z - blockerDepth ) * shadowRadius, 1.5 / shadowMapSize.x );
  float lit = 0.0;
  for ( int i = 0; i < 32; i ++ ) {
    float r = sqrt( ( float( i ) + 0.5 ) / 32.0 );
    float a = float( i ) * 2.3999632;
    lit += step( shadowCoord.z, textureLod( shadowMap, shadowCoord.xy + turn * vec2( cos( a ), sin( a ) ) * r * penumbra, 0.0 ).r );
  }
  return mix( 1.0, lit / 32.0, shadowIntensity );
}
`

const BASIC_LOOKUP = 'float getShadow( sampler2D shadowMap'

/**
 * `chunk` with its BASIC shadow lookup swapped for the soft one. That lookup
 * is the last `getShadow` taking a plain `sampler2D` (VSM's comes before it);
 * the bundled chunk has no comments to anchor on, so the function is found by
 * its signature and closed by matching braces.
 */
export const softenShadowLookup = (chunk: string): string => {
  if (chunk.includes(SOFT_SHADOW)) return chunk
  const start = chunk.lastIndexOf(BASIC_LOOKUP)
  if (start < 0) {
    throw new Error(
      'three changed its shadow chunk: the soft shadow lookup no longer fits'
    )
  }
  let depth = 0
  for (let end = chunk.indexOf('{', start); end < chunk.length; end += 1) {
    if (chunk[end] === '{') depth += 1
    if (chunk[end] === '}') {
      depth -= 1
      if (depth === 0)
        return chunk.slice(0, start) + SOFT_SHADOW + chunk.slice(end + 1)
    }
  }
  throw new Error(
    'three changed its shadow chunk: the soft shadow lookup no longer fits'
  )
}

/**
 * Shadows that soften with distance for every game: a piece resting on the
 * floor casts a crisp shadow, the same piece lifted casts a wide, faint one.
 * Call before the first render; each shadow-casting light then goes through
 * `softenShadow`.
 */
export const enableSoftShadows = (renderer: WebGLRenderer): void => {
  ShaderChunk.shadowmap_pars_fragment = softenShadowLookup(
    ShaderChunk.shadowmap_pars_fragment
  )
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = BasicShadowMap
}

/** Sets a directional light's spread from its shadow camera, once that camera's box is set. */
export const softenShadow = (
  light: DirectionalLight,
  lampAngle = LAMP_ANGLE
): void => {
  const { far, left, near, right } = light.shadow.camera
  light.shadow.radius = ((far - near) * lampAngle) / (right - left)
}
