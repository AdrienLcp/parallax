/** Where a sound plays: the audio graph and the node it feeds. */
export type SoundTarget = {
  readonly context: BaseAudioContext
  readonly destination: AudioNode
}

/** A quick rise to `peak`, then an exponential fall to silence over `decay` (both in seconds). */
export type Envelope = {
  readonly attack: number
  readonly decay: number
  readonly peak: number
}

type Timed = SoundTarget &
  Envelope & {
    /** When the sound starts, on the context's clock. */
    readonly at: number
  }

export type ToneInput = Timed & {
  readonly frequency: number
  /** Where the pitch slides to by the end of the decay. */
  readonly glideTo?: number
  /** Rounds off the upper harmonics of a bright waveform. */
  readonly lowpass?: number
  readonly type?: OscillatorType
}

export type NoiseInput = Timed & {
  readonly filter: BiquadFilterType
  readonly frequency: number
  /** Where the filter sweeps to by the end of the decay. */
  readonly frequencyTo?: number
  readonly q?: number
}

/** An exponential ramp cannot reach zero: this is quiet enough to be silence. */
const SILENCE = 0.0001

/** Lets the oscillator outlive its envelope so the fall is never cut short. */
const STOP_MARGIN_SECONDS = 0.05

const NOISE_SECONDS = 1

const noiseBuffers = new WeakMap<BaseAudioContext, AudioBuffer>()

export const frequencyOfMidi = (midi: number): number =>
  440 * 2 ** ((midi - 69) / 12)

export const endOf = ({ at, attack, decay }: Timed): number =>
  at + attack + decay

const envelopeGain = (input: Timed): GainNode => {
  const { at, attack, context, destination, peak } = input
  const gain = context.createGain()
  gain.gain.setValueAtTime(SILENCE, at)
  gain.gain.exponentialRampToValueAtTime(peak, at + attack)
  gain.gain.exponentialRampToValueAtTime(SILENCE, endOf(input))
  gain.connect(destination)
  return gain
}

const noiseBufferOf = (context: BaseAudioContext): AudioBuffer => {
  const cached = noiseBuffers.get(context)
  if (cached !== undefined) return cached

  const buffer = context.createBuffer(
    1,
    Math.round(context.sampleRate * NOISE_SECONDS),
    context.sampleRate
  )
  const samples = buffer.getChannelData(0)
  for (let index = 0; index < samples.length; index++) {
    samples[index] = Math.random() * 2 - 1
  }
  noiseBuffers.set(context, buffer)
  return buffer
}

/** One oscillator through an envelope: a pluck, a ping, a slide. */
export const playTone = (input: ToneInput): void => {
  const { at, context, frequency, glideTo, lowpass, type = 'sine' } = input
  const end = endOf(input)
  const gain = envelopeGain(input)
  const oscillator = context.createOscillator()
  oscillator.type = type
  oscillator.frequency.setValueAtTime(frequency, at)
  if (glideTo !== undefined) {
    oscillator.frequency.exponentialRampToValueAtTime(glideTo, end)
  }

  if (lowpass === undefined) {
    oscillator.connect(gain)
  } else {
    const filter = context.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = lowpass
    oscillator.connect(filter).connect(gain)
  }

  oscillator.start(at)
  oscillator.stop(end + STOP_MARGIN_SECONDS)
}

/** Filtered white noise through an envelope: a brush, a whoosh, the grain of a knock. */
export const playNoise = (input: NoiseInput): void => {
  const { at, context, filter, frequency, frequencyTo, q = 1 } = input
  const end = endOf(input)
  const gain = envelopeGain(input)
  const shaping = context.createBiquadFilter()
  shaping.type = filter
  shaping.Q.value = q
  shaping.frequency.setValueAtTime(frequency, at)
  if (frequencyTo !== undefined) {
    shaping.frequency.exponentialRampToValueAtTime(frequencyTo, end)
  }

  const source = context.createBufferSource()
  source.buffer = noiseBufferOf(context)
  source.connect(shaping).connect(gain)
  source.start(at, Math.random() * (NOISE_SECONDS / 2))
  source.stop(end + STOP_MARGIN_SECONDS)
}

/** A struck metal bar, like a vibraphone: the note and its fourth harmonic, which dies first. */
export const playBell = (
  input: Timed & { readonly frequency: number }
): void => {
  playTone(input)
  playTone({
    ...input,
    decay: input.decay / 3,
    frequency: input.frequency * 4,
    peak: input.peak / 6
  })
}
