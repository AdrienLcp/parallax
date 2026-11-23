import type React from 'react'
import { encode } from 'uqr'

import type { RoomCode } from '@parallax/protocol/identifiers'

import { sameOriginUrl } from '@/infrastructure/browser'
import { playPathFor } from '@/infrastructure/router/navigation'
import { useTranslate } from '@/presentation/i18n/i18n-provider'

import './room-qr.sass'

/** The light margin a reader needs around the code, in modules: four by the standard. */
const QUIET_ZONE_MODULES = 4

/** One `M…h…v1…z` per run of dark modules on a row: one path for the whole code. */
const darkModulesPath = (modules: readonly (readonly boolean[])[]): string =>
  modules
    .flatMap((row, y) =>
      row.flatMap((isDark, x) => {
        const startsRun = isDark && row[x - 1] !== true

        if (!startsRun) {
          return []
        }

        const runEnd = row.indexOf(false, x)
        const length = (runEnd === -1 ? row.length : runEnd) - x

        return [`M${x} ${y}h${length}v1h-${length}z`]
      })
    )
    .join('')

type RoomQrProps = {
  code: RoomCode
}

/** The code a phone scans to take a seat in the room: dark on ivory, its quiet zone included. */
export const RoomQr: React.FC<RoomQrProps> = ({ code }) => {
  const translate = useTranslate()
  const qr = encode(sameOriginUrl(playPathFor(code)), {
    border: QUIET_ZONE_MODULES,
    ecc: 'M'
  })

  return (
    <svg
      aria-label={translate('screen.qr', { code })}
      className='room-qr'
      role='img'
      shapeRendering='crispEdges'
      viewBox={`0 0 ${qr.size} ${qr.size}`}
    >
      <rect className='quiet-zone' height={qr.size} width={qr.size} />
      <path className='dark-modules' d={darkModulesPath(qr.data)} />
    </svg>
  )
}
