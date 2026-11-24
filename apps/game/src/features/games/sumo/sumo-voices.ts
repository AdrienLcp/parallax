import {
  frequencyOfMidi,
  playBell,
  playNoise,
  playTone,
  type SoundTarget
} from '@/helpers/synth'

import type { SoundCue } from '../game-definition'
import type { SumoSoundCue } from './sumo-sound-cues'

/** Two lacquered wooden tops knocking: a dry crack, a high ping and a low body. */
const clack =
  (strength: number): SoundCue =>
  (target) => {
    const at = target.context.currentTime
    const pitch = 0.9 + Math.random() * 0.2
    playNoise({
      ...target,
      at,
      attack: 0.001,
      decay: 0.03,
      filter: 'bandpass',
      frequency: 2200 * pitch,
      peak: 0.35 * strength,
      q: 3
    })
    playTone({
      ...target,
      at,
      attack: 0.001,
      decay: 0.07,
      frequency: 1900 * pitch,
      peak: 0.12 * strength
    })
    playTone({
      ...target,
      at,
      attack: 0.002,
      decay: 0.05,
      frequency: 260 * pitch,
      peak: 0.2 * strength
    })
  }

/** A short rising whoosh. */
const dash: SoundCue = (target) => {
  playNoise({
    ...target,
    at: target.context.currentTime,
    attack: 0.06,
    decay: 0.2,
    filter: 'bandpass',
    frequency: 450,
    frequencyTo: 2600,
    peak: 0.16,
    q: 1.4
  })
}

/** A top sliding over the rim, then dropping into the gutter with a soft thud. */
const fall: SoundCue = (target) => {
  const at = target.context.currentTime
  playTone({
    ...target,
    at,
    attack: 0.01,
    decay: 0.45,
    frequency: 520,
    glideTo: 120,
    lowpass: 1800,
    peak: 0.12,
    type: 'triangle'
  })
  playTone({
    ...target,
    at: at + 0.42,
    attack: 0.003,
    decay: 0.18,
    frequency: 140,
    glideTo: 70,
    peak: 0.35
  })
  playNoise({
    ...target,
    at: at + 0.42,
    attack: 0.002,
    decay: 0.08,
    filter: 'lowpass',
    frequency: 500,
    peak: 0.2
  })
}

/** A wood block for each second of the countdown, a brighter bell when the fight starts. */
const countdown: SoundCue = (target) => {
  playTone({
    ...target,
    at: target.context.currentTime,
    attack: 0.001,
    decay: 0.09,
    frequency: 1040,
    peak: 0.22
  })
}

const chime =
  (notes: readonly number[], { spacing = 0.1, decay = 1.1 } = {}): SoundCue =>
  (target: SoundTarget) => {
    const at = target.context.currentTime
    notes.forEach((midi, index) => {
      playBell({
        ...target,
        at: at + index * spacing,
        attack: 0.003,
        decay,
        frequency: frequencyOfMidi(midi),
        peak: 0.16
      })
    })
  }

const fight = chime([84, 91], { decay: 0.6, spacing: 0 })
const roundWon = chime([77, 81, 84])
const matchWon = chime([77, 81, 84, 89, 84, 89], { decay: 1.6, spacing: 0.12 })

const draw: SoundCue = (target) => {
  const at = target.context.currentTime
  for (const [offset, midi] of [
    [0, 70],
    [0.18, 66]
  ] as const) {
    playTone({
      ...target,
      at: at + offset,
      attack: 0.005,
      decay: 0.35,
      frequency: frequencyOfMidi(midi),
      lowpass: 1400,
      peak: 0.12,
      type: 'triangle'
    })
  }
}

/** How each of the sumo's cues sounds. */
export const voiceOf = (cue: SumoSoundCue): SoundCue => {
  switch (cue.kind) {
    case 'clack':
      return clack(cue.strength)
    case 'countdown':
      return countdown
    case 'dash':
      return dash
    case 'draw':
      return draw
    case 'fall':
      return fall
    case 'fight':
      return fight
    case 'matchWon':
      return matchWon
    case 'roundWon':
      return roundWon
    default:
      return cue satisfies never
  }
}
