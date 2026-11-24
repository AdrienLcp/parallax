import { describe, expect, it } from 'vitest'

import { cleanSeatName, SEAT_NAME_MAX_LENGTH, seatNameSchema } from './lobby'

describe('seat name', () => {
  it('[lobby] a typed name is trimmed, its spaces collapsed, its invisible characters dropped', () => {
    expect(cleanSeatName('  Ada \t  Lovelace ')).toBe('Ada Lovelace')
    expect(cleanSeatName('Bo‮b\u0007')).toBe('Bob')
  })

  it('[lobby] a typed name with nothing shown left goes by the colour', () => {
    expect(cleanSeatName('   ')).toBeNull()
    expect(cleanSeatName('​')).toBeNull()
  })

  it('[lobby] a typed name is cut to the longest a seat shows', () => {
    expect(cleanSeatName('Christopher Robin')).toBe('Christopher')
    expect(cleanSeatName('Jean-Baptiste x')?.length).toBeLessThanOrEqual(
      SEAT_NAME_MAX_LENGTH
    )
  })

  it('[lobby] the room refuses a name a phone did not clean', () => {
    expect(seatNameSchema.safeParse('Ada').success).toBe(true)
    expect(seatNameSchema.safeParse(' Ada').success).toBe(false)
    expect(seatNameSchema.safeParse('A  da').success).toBe(false)
    expect(seatNameSchema.safeParse('Bo‮b').success).toBe(false)
    expect(seatNameSchema.safeParse('').success).toBe(false)
    expect(seatNameSchema.safeParse('x'.repeat(13)).success).toBe(false)
  })
})
