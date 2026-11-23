import type { SeatSlot } from '@parallax/protocol/room'

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
