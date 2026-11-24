import type React from 'react'
import { createContext, use, useEffect, useMemo, useRef, useState } from 'react'

import type { SceneSound } from '@/features/games/game-definition'
import {
  readSoundMuted,
  writeSoundMuted
} from '@/infrastructure/storage/sound-muted-storage'

import type { MusicMood, SoundEngine } from './sound-engine'

export type { MusicMood } from './sound-engine'

/** What the room drives: the game's cues, and how present the music is. */
export type RoomSound = SceneSound & {
  setMood: (mood: MusicMood) => void
}

type DisplaySound = {
  isMuted: boolean
  sound: RoomSound
  toggleMuted: () => void
}

const DisplaySoundContext = createContext<DisplaySound | null>(null)

/** Where storage is blocked the display plays: the mute still works for the visit. */
const readIsMuted = (): boolean => {
  const stored = readSoundMuted()
  return stored.status === 'success' && stored.data
}

/**
 * Owns the display's sound for as long as it shows rooms. The audio code loads
 * and starts on the first touch or key press, since browsers keep audio
 * blocked until then, or at once if the visitor already pressed something on
 * the way here. The mute is kept in this browser.
 */
export const DisplaySoundProvider: React.FC<React.PropsWithChildren> = ({
  children
}) => {
  const [isMuted, setIsMuted] = useState(readIsMuted)
  const engine = useRef<SoundEngine | null>(null)
  const mood = useRef<MusicMood>('resting')
  const muted = useRef(isMuted)

  useEffect(() => {
    let isDisposed = false
    let isLoading = false

    const start = () => {
      if (engine.current !== null) {
        engine.current.resume()
        return
      }
      if (isLoading) return
      isLoading = true
      void import('./sound-engine').then(({ createSoundEngine }) => {
        if (isDisposed) return
        engine.current = createSoundEngine({
          isMuted: muted.current,
          mood: mood.current
        })
      })
    }

    if (navigator.userActivation?.hasBeenActive) start()
    window.addEventListener('pointerdown', start)
    window.addEventListener('keydown', start)

    return () => {
      isDisposed = true
      window.removeEventListener('pointerdown', start)
      window.removeEventListener('keydown', start)
      engine.current?.dispose()
      engine.current = null
    }
  }, [])

  const sound = useMemo<RoomSound>(
    () => ({
      play: (cue) => engine.current?.play(cue),
      setMood: (next) => {
        mood.current = next
        engine.current?.setMood(next)
      }
    }),
    []
  )

  const value = useMemo<DisplaySound>(
    () => ({
      isMuted,
      sound,
      toggleMuted: () => {
        const next = !muted.current
        muted.current = next
        setIsMuted(next)
        writeSoundMuted(next)
        engine.current?.setMuted(next)
      }
    }),
    [isMuted, sound]
  )

  return <DisplaySoundContext value={value}>{children}</DisplaySoundContext>
}

export const useDisplaySound = (): DisplaySound => {
  const displaySound = use(DisplaySoundContext)
  if (displaySound === null) {
    throw new Error('useDisplaySound needs a DisplaySoundProvider above it.')
  }
  return displaySound
}
