import type React from 'react'

import type { TowerBlock } from '@parallax/protocol/tower'

import { ARCH_LEG, ARCH_LINTEL, blockProfile, blockSize } from './tower-blocks'

/** The glyphs are drawn at this size unit, in the SVG's own units. */
const UNIT = 20
const MARGIN = 2

type BlockGlyphProps = {
  className?: string
  kind: TowerBlock
}

/** A block seen from the front, flat, filled with the current colour: what the pick buttons show. */
export const BlockGlyph: React.FC<BlockGlyphProps> = ({ className, kind }) => {
  const { h, w } = blockSize(kind, UNIT)
  const width = 3 * UNIT + 2 * MARGIN
  const height = 1.4 * UNIT + 2 * MARGIN
  const toX = (x: number) => width / 2 + x
  const toY = (y: number) => height - MARGIN - (y + h / 2)
  const profile = blockProfile(kind, UNIT)
  const leg = ARCH_LEG * UNIT
  const radius = w / 2 - leg
  const spring = toY(h / 2 - ARCH_LINTEL * UNIT - radius)
  const outline =
    kind === 'arch'
      ? `M${toX(-w / 2)} ${toY(-h / 2)} H${toX(-w / 2 + leg)} V${spring} A${radius} ${radius} 0 0 1 ${toX(w / 2 - leg)} ${spring} V${toY(-h / 2)} H${toX(w / 2)} V${toY(h / 2)} H${toX(-w / 2)} Z`
      : profile
          ?.map(
            ({ x, y }, index) =>
              `${index === 0 ? 'M' : 'L'}${toX(x).toFixed(1)} ${toY(y).toFixed(1)}`
          )
          .join(' ')
          .concat(' Z')
  return (
    <svg
      aria-hidden='true'
      className={className}
      fill='currentColor'
      viewBox={`0 0 ${width} ${height}`}
    >
      {outline === undefined ? (
        <rect
          height={h}
          rx={UNIT * 0.12}
          width={w}
          x={toX(-w / 2)}
          y={toY(h / 2)}
        />
      ) : (
        <path d={outline} />
      )}
    </svg>
  )
}
