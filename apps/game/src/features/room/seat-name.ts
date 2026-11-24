import type { Seat, SeatSlot } from '@parallax/protocol/room'

import type { Translate } from '@/presentation/i18n/translation'

/** Each slot's lacquer, in slot order: what players call a seat. */
const SEAT_COLOURS = [
  'red',
  'ivory',
  'black',
  'ochre',
  'blue',
  'green'
] as const

type SeatColour = (typeof SEAT_COLOURS)[number]

/** The dictionary key naming a seat by its colour: "Red", "Rouge". */
export const seatNameKey = (slot: SeatSlot): `seat.${SeatColour}` =>
  `seat.${SEAT_COLOURS[slot] ?? 'red'}`

/** What the room calls a seat: the name its player picked, or its colour. */
export const seatNameOf = (
  seat: Pick<Seat, 'name' | 'slot'>,
  translate: Translate
): string => seat.name ?? translate(seatNameKey(seat.slot))
