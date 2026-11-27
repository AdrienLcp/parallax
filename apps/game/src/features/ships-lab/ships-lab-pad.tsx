import type React from 'react'
import { useEffect, useRef, useState } from 'react'

import type { RoomCode } from '@parallax/protocol/identifiers'
import type { PlayerRoomMessage } from '@parallax/protocol/server-message'
import { playerEventSchema } from '@parallax/protocol/server-message'
import { SHIPS_PAD_HZ, type ShipsPad } from '@parallax/protocol/ships'

import { FloatingStick } from '@/features/games/sumo/floating-stick'
import { steppedStick } from '@/features/games/sumo/stick-pacing'
import { usePlayerSessionId } from '@/features/play/use-player-session-id'
import { useUpright } from '@/features/play/use-upright'
import type { PlanarVector } from '@/helpers/planar-vector'
import { paintBrowserBarBehind, vibrate } from '@/infrastructure/browser'
import { useRoomSocket } from '@/infrastructure/messaging/use-room-socket'
import { Button } from '@/presentation/components/button'
import { Main } from '@/presentation/components/main'
import { useTranslate } from '@/presentation/i18n/i18n-provider'

import type { FlightMode } from './ships-lab-flight'
import { useFlightModeParam, useLabRoomCodeParam } from './ships-lab-mode'

import '@/features/games/sumo/sumo-controller.sass'
import '@/features/play/play-page.sass'
import './ships-lab-pad.sass'

const SEND_INTERVAL_MS = 1000 / SHIPS_PAD_HZ
/** A held pad still goes out this often, so a screen that reconnected hears it again. */
const RESEND_EVERY_MS = 1000
const FIRE_BUZZ_MS = 15

type Pad = Omit<ShipsPad, 'type'>

const sameStick = (a: PlanarVector, b: PlanarVector) =>
  a.x === b.x && a.y === b.y

const samePad = (a: Pad, b: Pad) =>
  a.depth === b.depth &&
  a.fire === b.fire &&
  sameStick(a.left, b.left) &&
  sameStick(a.right, b.right)

type HoldButtonProps = {
  className: string
  label: string
  onHold: (isHeld: boolean) => void
}

/** A button that counts while the thumb stays on it. */
const HoldButton: React.FC<HoldButtonProps> = ({
  className,
  label,
  onHold
}) => (
  <Button
    className={`lab-hold ${className}`}
    onPressEnd={() => onHold(false)}
    onPressStart={() => onHold(true)}
  >
    {label}
  </Button>
)

type LabControllerProps = {
  mode: FlightMode
  roomCode: RoomCode
}

const LabController: React.FC<LabControllerProps> = ({ mode, roomCode }) => {
  const translate = useTranslate()
  const sessionId = usePlayerSessionId()
  const isUpright = useUpright()
  const [room, setRoom] = useState<PlayerRoomMessage | null>(null)
  const padRef = useRef<Pad>({
    depth: 0,
    fire: false,
    left: { x: 0, y: 0 },
    right: { x: 0, y: 0 }
  })
  const heldRef = useRef({ far: false, near: false })

  const socket = useRoomSocket({
    credentials: { role: 'player', sessionId },
    eventSchema: playerEventSchema,
    onEvent: (event) => {
      if (event.type === 'room.updated') setRoom(event)
    },
    roomCode
  })
  const sendRef = useRef(socket.send)
  sendRef.current = socket.send

  useEffect(() => {
    let lastSent: Pad | null = null
    let lastSentAt = 0
    const timer = setInterval(() => {
      const pad = padRef.current
      const now = performance.now()
      if (
        lastSent !== null &&
        samePad(lastSent, pad) &&
        now - lastSentAt < RESEND_EVERY_MS
      ) {
        return
      }
      if (sendRef.current({ ...pad, type: 'ships.pad' })) {
        lastSent = pad
        lastSentAt = now
      }
    }, SEND_INTERVAL_MS)
    return () => clearInterval(timer)
  }, [])

  const update = (change: Partial<Pad>) => {
    padRef.current = { ...padRef.current, ...change }
  }
  const holdDepth = (side: 'far' | 'near', isHeld: boolean) => {
    heldRef.current = { ...heldRef.current, [side]: isHeld }
    const { far, near } = heldRef.current
    update({ depth: (far ? 1 : 0) - (near ? 1 : 0) })
  }

  if (socket.status.kind === 'refused') {
    return <p className='lab-pad-notice'>{translate('shipsLab.refused')}</p>
  }

  const ownSeat = room?.seats.find((seat) => seat.seatId === room.youId)

  if (ownSeat === undefined) {
    return (
      <p className='lab-pad-notice' role='status'>
        {translate('shipsLab.connecting')}
      </p>
    )
  }

  return (
    <div
      className='sumo-controller ships-lab-pad'
      data-mode={mode}
      data-seat-slot={ownSeat.slot}
      data-turned={isUpright || undefined}
      data-view='pad'
      ref={paintBrowserBarBehind}
    >
      <section className='pad' inert={socket.status.kind !== 'open'}>
        <div className='lab-side move-side'>
          <FloatingStick
            onStick={(stick) => update({ left: steppedStick(stick) })}
            slot={ownSeat.slot}
          />
          {mode === 'screen' && (
            <div className='depth-buttons'>
              <HoldButton
                className='depth-far'
                label={translate('shipsLab.far')}
                onHold={(isHeld) => holdDepth('far', isHeld)}
              />
              <HoldButton
                className='depth-near'
                label={translate('shipsLab.near')}
                onHold={(isHeld) => holdDepth('near', isHeld)}
              />
            </div>
          )}
        </div>
        <div className='lab-side aim-side'>
          <FloatingStick
            onStick={(stick) => update({ right: steppedStick(stick) })}
            slot={ownSeat.slot}
          />
          {mode === 'pilot' && (
            <HoldButton
              className='fire-button'
              label={translate('shipsLab.fire')}
              onHold={(isHeld) => {
                if (isHeld) vibrate(FIRE_BUZZ_MS)
                update({ fire: isHeld })
              }}
            />
          )}
        </div>
      </section>
    </div>
  )
}

/** The phone of the ships' lab: the pad of the flight mode its code was made for. */
export const ShipsLabPad: React.FC = () => {
  const translate = useTranslate()
  const mode = useFlightModeParam()
  const roomCode = useLabRoomCodeParam()

  return (
    <Main className='play-page'>
      {mode === null || roomCode === null ? (
        <p className='lab-pad-notice'>{translate('shipsLab.unknownMode')}</p>
      ) : (
        <LabController key={roomCode} mode={mode} roomCode={roomCode} />
      )}
    </Main>
  )
}
