import type React from 'react'
import { useRef, useState } from 'react'

import { cleanSeatName, SEAT_NAME_MAX_LENGTH } from '@parallax/protocol/lobby'
import type { Seat } from '@parallax/protocol/room'

import { warnOnFailure } from '@/infrastructure/diagnostics'
import type { RoomSocket } from '@/infrastructure/messaging/use-room-socket'
import {
  readStoredSeatName,
  writeStoredSeatName
} from '@/infrastructure/storage/seat-name-storage'
import { useTranslate } from '@/presentation/i18n/i18n-provider'

import { CheckMark } from './check-mark'
import { seatNameKey } from './seat-name'
import { SeatTop } from './seat-top'

import './lobby-sheet.sass'

/** Below this many characters a name keeps the field's full size; longer ones shrink to fit. */
const SHORTEST_FITTED_NAME = 5

/** Spaces a name would lose anyway would otherwise eat into its few characters while typing. */
const withoutExtraSpaces = (typed: string): string =>
  typed.replace(/^\s+/u, '').replace(/\s{2,}/gu, ' ')

const storedSeatName = (): string | null => {
  const stored = readStoredSeatName()
  warnOnFailure(stored, 'Reading the seat name')

  return stored.status === 'success' ? stored.data : null
}

const PencilPictogram: React.FC = () => (
  <svg
    aria-hidden='true'
    className='pencil-pictogram'
    fill='none'
    stroke='currentColor'
    strokeLinecap='round'
    strokeLinejoin='round'
    strokeWidth='4'
    viewBox='0 0 48 48'
  >
    <path d='M10 38 L12 29 L31 10 L38 17 L19 36 Z' />
    <path d='M27 14 L34 21' />
  </svg>
)

type ReadyCountProps = {
  fewest: number
  seats: readonly Seat[]
}

const ReadyCount: React.FC<ReadyCountProps> = ({ fewest, seats }) => {
  const translate = useTranslate()
  const present = seats.filter((seat) => seat.isConnected)
  const ready = present.filter((seat) => seat.isReady).length

  return (
    <p className='lobby-count' role='status'>
      {present.length < fewest
        ? translate('lobby.fewest', { fewest })
        : translate('lobby.readyCount', { present: present.length, ready })}
    </p>
  )
}

type LobbySheetProps = {
  /** The game's own cue, under the seat while the player waits. */
  children?: React.ReactNode
  /** Present players a game needs: until then, the sheet says so. */
  fewest: number
  seat: Seat
  seats: readonly Seat[]
  send: RoomSocket['send']
}

/**
 * The player's seat before a game: their top, the name the room will call
 * them (the colour until they type one, the last one they picked offered
 * again), and the ready toggle. The name is sent with the ready mark and
 * stays fixed until the mark is taken back.
 */
export const LobbySheet: React.FC<LobbySheetProps> = ({
  children,
  fewest,
  seat,
  seats,
  send
}) => {
  const translate = useTranslate()
  const nameField = useRef<HTMLInputElement>(null)
  const [typed, setTyped] = useState(() => seat.name ?? storedSeatName() ?? '')
  const shownName = seat.isReady ? (seat.name ?? '') : typed
  const colourName = translate(seatNameKey(seat.slot))

  const markReady = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const name = cleanSeatName(typed)

    setTyped(name ?? '')
    warnOnFailure(writeStoredSeatName(name), 'Storing the seat name')
    nameField.current?.blur()
    send({ name, type: 'seat.ready' })
  }

  const markUnready = () => {
    send({ type: 'seat.unready' })
  }

  return (
    <section className='lobby-sheet' data-ready={seat.isReady ? '' : undefined}>
      <form className='lobby-form' onSubmit={markReady}>
        <div className='lobby-seat'>
          <SeatTop className='lobby-top' slot={seat.slot} />
          <label className='lobby-name-field'>
            <span className='lobby-name-label'>{translate('lobby.name')}</span>
            <input
              autoCapitalize='words'
              autoComplete='nickname'
              className='lobby-name'
              enterKeyHint='done'
              maxLength={SEAT_NAME_MAX_LENGTH}
              onChange={(event) =>
                setTyped(withoutExtraSpaces(event.target.value))
              }
              placeholder={colourName}
              readOnly={seat.isReady}
              ref={nameField}
              spellCheck={false}
              style={{
                '--name-length': Math.max(
                  (shownName || colourName).length,
                  SHORTEST_FITTED_NAME
                )
              }}
              value={shownName}
            />
            <PencilPictogram />
          </label>
        </div>
        <div className='lobby-action'>
          <button
            aria-pressed={seat.isReady}
            className='lobby-ready'
            onClick={seat.isReady ? markUnready : undefined}
            type={seat.isReady ? 'button' : 'submit'}
          >
            {seat.isReady && <CheckMark className='lobby-ready-mark' />}
            {translate('lobby.ready')}
          </button>
          <ReadyCount fewest={fewest} seats={seats} />
        </div>
      </form>
      {children}
    </section>
  )
}
