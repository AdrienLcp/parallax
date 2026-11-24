import {
  endOf,
  frequencyOfMidi,
  playBell,
  playNoise,
  playTone,
  type SoundTarget
} from '@/helpers/synth'

const BEATS_PER_MINUTE = 92
const BEAT_SECONDS = 60 / BEATS_PER_MINUTE
const BEATS_PER_BAR = 4
export const BAR_SECONDS = BEATS_PER_BAR * BEAT_SECONDS

/** A swung upbeat falls two thirds of the way through its beat. */
const SWUNG = 2 / 3

/** Bars scheduled ahead of the clock, so a late timer never leaves a gap. */
const LOOKAHEAD_SECONDS = 1.5
const FILL_EVERY_MS = 250

type Chord = {
  /** The root, then the fifth, on the bass. */
  readonly bass: readonly [number, number]
  /** Rootless piano voicing, in MIDI notes. */
  readonly voicing: readonly number[]
}

type Phrase = readonly (readonly [beat: number, midi: number, beats: number])[]

/** F major 7, Dm7, Gm7, C7, Am7, D7, Gm7, C7: a slow café turnaround in F. */
const CHORDS: readonly Chord[] = [
  { bass: [41, 48], voicing: [57, 60, 64] },
  { bass: [38, 45], voicing: [53, 57, 60] },
  { bass: [43, 50], voicing: [53, 58, 62] },
  { bass: [36, 43], voicing: [52, 58, 62] },
  { bass: [45, 40], voicing: [55, 60, 64] },
  { bass: [38, 45], voicing: [54, 60, 64] },
  { bass: [43, 50], voicing: [53, 58, 62] },
  { bass: [36, 43], voicing: [52, 58, 62] }
]

const MELODY: readonly Phrase[] = [
  [
    [0, 69, 1.5],
    [1 + SWUNG, 67, 0.4],
    [2, 65, 1],
    [3, 64, 1]
  ],
  [
    [0, 62, 1],
    [1, 65, 1],
    [2, 69, 2]
  ],
  [
    [0, 70, 1.5],
    [1 + SWUNG, 69, 0.4],
    [2, 67, 1],
    [3, 65, 1]
  ],
  [
    [0, 64, 2],
    [2, 67, 1],
    [3, 70, 1]
  ],
  [
    [0, 72, 1.5],
    [1 + SWUNG, 69, 0.4],
    [2, 67, 1],
    [3, 64, 1]
  ],
  [
    [0, 66, 1],
    [1, 69, 1],
    [2, 72, 1],
    [3, 69, 1]
  ],
  [
    [0, 70, 1],
    [1, 67, 1],
    [2, 74, 1.5],
    [3 + SWUNG, 72, 0.4]
  ],
  [
    [0, 70, 1],
    [1, 67, 1],
    [2, 64, 1.5]
  ]
]

/** The last bar walks back to the top: C, E, G, then G flat into the F. */
const WALK_HOME = [36, 40, 43, 42] as const

/** The ride's spang-a-lang, and how hard each stroke falls. */
const RIDE: readonly (readonly [beat: number, peak: number])[] = [
  [0, 0.018],
  [1, 0.018],
  [1 + SWUNG, 0.011],
  [2, 0.018],
  [3, 0.018],
  [3 + SWUNG, 0.011]
]

const BRUSH_BEATS = [1, 3] as const

/** The piano's Charleston on even bars, a push onto the fourth beat on odd ones. */
const COMPING: readonly (readonly (readonly [
  beat: number,
  beats: number
])[])[] = [
  [
    [0, 1.5],
    [1 + SWUNG, 1]
  ],
  [
    [0, 1],
    [2 + SWUNG, 1.2]
  ]
]

/** One note of the loop, timed in beats from the start of its bar. */
export type BarNote =
  | {
      readonly beat: number
      readonly beats: number
      readonly instrument: 'bass' | 'bell' | 'piano'
      readonly midi: number
    }
  | {
      readonly beat: number
      readonly instrument: 'brush' | 'ride'
      readonly peak: number
    }

/**
 * The notes of bar `index`: the eight-bar turnaround played twice, the
 * vibraphone tune on the first pass only, so it never wears on the room.
 */
export const bistroBarOf = (index: number): BarNote[] => {
  const position = index % CHORDS.length
  const chord = CHORDS[position] ?? CHORDS[0]
  if (chord === undefined) return []

  const isLastBar = position === CHORDS.length - 1
  const hasTune = index % (CHORDS.length * 2) < CHORDS.length

  const bass: BarNote[] = isLastBar
    ? WALK_HOME.map((midi, beat) => ({
        beat,
        beats: 0.95,
        instrument: 'bass',
        midi
      }))
    : chord.bass.map((midi, half) => ({
        beat: half * 2,
        beats: 1.9,
        instrument: 'bass',
        midi
      }))

  const piano: BarNote[] = (COMPING[index % 2] ?? []).flatMap(([beat, beats]) =>
    chord.voicing.map((midi) => ({ beat, beats, instrument: 'piano', midi }))
  )

  const tune: BarNote[] = hasTune
    ? (MELODY[position] ?? []).map(([beat, midi, beats]) => ({
        beat,
        beats,
        instrument: 'bell',
        midi
      }))
    : []

  const kit: BarNote[] = [
    ...RIDE.map(
      ([beat, peak]): BarNote => ({ beat, instrument: 'ride', peak })
    ),
    ...BRUSH_BEATS.map(
      (beat): BarNote => ({ beat, instrument: 'brush', peak: 0.045 })
    )
  ]

  return [...bass, ...piano, ...tune, ...kit]
}

/** A warm electric piano: a sine whose brightness, a second sine modulating it, fades as the note rings. */
const playElectricPiano = ({
  at,
  context,
  destination,
  frequency,
  seconds
}: SoundTarget & { at: number; frequency: number; seconds: number }) => {
  const envelope = { at, attack: 0.008, decay: seconds + 0.6, peak: 0.07 }
  const end = endOf({ ...envelope, context, destination })
  const gain = context.createGain()
  gain.gain.setValueAtTime(0.0001, at)
  gain.gain.exponentialRampToValueAtTime(envelope.peak, at + envelope.attack)
  gain.gain.exponentialRampToValueAtTime(0.0001, end)
  gain.connect(destination)

  const modulator = context.createOscillator()
  modulator.frequency.value = frequency
  const depth = context.createGain()
  depth.gain.setValueAtTime(frequency * 1.2, at)
  depth.gain.exponentialRampToValueAtTime(frequency * 0.08, at + 0.5)

  const carrier = context.createOscillator()
  carrier.frequency.value = frequency
  modulator.connect(depth).connect(carrier.frequency)
  carrier.connect(gain)

  for (const oscillator of [modulator, carrier]) {
    oscillator.start(at)
    oscillator.stop(end + 0.05)
  }
}

const playNote = (target: SoundTarget, note: BarNote, at: number): void => {
  switch (note.instrument) {
    case 'bass':
      playTone({
        ...target,
        at,
        attack: 0.006,
        decay: note.beats * BEAT_SECONDS,
        frequency: frequencyOfMidi(note.midi),
        lowpass: 650,
        peak: 0.42,
        type: 'triangle'
      })
      return
    case 'piano':
      playElectricPiano({
        ...target,
        at,
        frequency: frequencyOfMidi(note.midi),
        seconds: note.beats * BEAT_SECONDS
      })
      return
    case 'bell':
      playBell({
        ...target,
        at,
        attack: 0.004,
        decay: Math.max(1.2, note.beats * BEAT_SECONDS),
        frequency: frequencyOfMidi(note.midi),
        peak: 0.08
      })
      return
    case 'brush':
      playNoise({
        ...target,
        at,
        attack: 0.03,
        decay: 0.14,
        filter: 'bandpass',
        frequency: 2600,
        peak: note.peak,
        q: 0.7
      })
      return
    case 'ride':
      playNoise({
        ...target,
        at,
        attack: 0.002,
        decay: 0.09,
        filter: 'highpass',
        frequency: 6500,
        peak: note.peak
      })
      return
    default:
      note satisfies never
  }
}

/**
 * Plays the café loop into `target` until the returned function is called,
 * a few bars ahead of the clock. While `isResting` holds, no new bar starts
 * and the loop picks up where it stopped once it no longer does.
 */
export const startBistroLoop = (
  target: SoundTarget,
  isResting: () => boolean
): (() => void) => {
  const { context } = target
  let bar = 0
  let nextBarAt = context.currentTime + 0.1

  const fill = () => {
    if (isResting()) return
    nextBarAt = Math.max(nextBarAt, context.currentTime + 0.1)
    while (nextBarAt < context.currentTime + LOOKAHEAD_SECONDS) {
      for (const note of bistroBarOf(bar)) {
        playNote(target, note, nextBarAt + note.beat * BEAT_SECONDS)
      }
      bar += 1
      nextBarAt += BAR_SECONDS
    }
  }

  fill()
  const timer = setInterval(fill, FILL_EVERY_MS)
  return () => clearInterval(timer)
}
