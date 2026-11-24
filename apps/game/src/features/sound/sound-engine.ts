import type { SceneSound } from '@/features/games/game-definition'

import { startBistroLoop } from './bistro-loop'

/**
 * How present the music is: resting while nobody holds a seat, so an idle
 * display stays quiet; in the room's foreground while players gather; under
 * the game's own cues while it runs.
 */
export type MusicMood = 'gathering' | 'playing' | 'resting'

export type SoundEngine = SceneSound & {
  dispose: () => void
  /** Wakes the audio again if the browser suspended it. */
  resume: () => void
  setMood: (mood: MusicMood) => void
  setMuted: (isMuted: boolean) => void
}

const MASTER_LEVEL = 0.8
const CUE_LEVEL = 0.9
const MUSIC_LEVELS: Readonly<Record<MusicMood, number>> = {
  gathering: 0.5,
  playing: 0.2,
  resting: 0
}
const MOOD_FADE_SECONDS = 0.8
const MUTE_FADE_SECONDS = 0.08

const gainInto = (
  context: AudioContext,
  destination: AudioNode,
  level: number
): GainNode => {
  const gain = context.createGain()
  gain.gain.value = level
  gain.connect(destination)
  return gain
}

/**
 * The display's audio graph: the café loop and the game's cues on two buses,
 * mixed through one master that the mute closes, and a compressor so a pile
 * of clacks never clips. Create it from a user gesture, or the browser keeps
 * it suspended.
 */
export const createSoundEngine = ({
  isMuted,
  mood
}: {
  isMuted: boolean
  mood: MusicMood
}): SoundEngine => {
  const context = new AudioContext({ latencyHint: 'interactive' })
  const compressor = context.createDynamicsCompressor()
  compressor.threshold.value = -18
  compressor.ratio.value = 4
  compressor.connect(context.destination)

  const master = gainInto(context, compressor, isMuted ? 0 : MASTER_LEVEL)
  const music = gainInto(context, master, MUSIC_LEVELS[mood])
  const cues = gainInto(context, master, CUE_LEVEL)
  let currentMood = mood

  const stopLoop = startBistroLoop(
    { context, destination: music },
    () => currentMood === 'resting'
  )
  const resume = () => {
    if (context.state === 'suspended') void context.resume()
  }
  resume()

  return {
    dispose: () => {
      stopLoop()
      void context.close()
    },
    play: (cue) => {
      if (context.state === 'running') cue({ context, destination: cues })
    },
    resume,
    setMood: (next) => {
      currentMood = next
      music.gain.setTargetAtTime(
        MUSIC_LEVELS[next],
        context.currentTime,
        MOOD_FADE_SECONDS / 3
      )
    },
    setMuted: (next) => {
      const now = context.currentTime
      master.gain.cancelScheduledValues(now)
      master.gain.setValueAtTime(master.gain.value, now)
      master.gain.linearRampToValueAtTime(
        next ? 0 : MASTER_LEVEL,
        now + MUTE_FADE_SECONDS
      )
    }
  }
}
