import { useEffect, useState } from 'react'

/** How long the late joiners' QR stays open after the last touch on the display. */
export const QR_REVEAL_SECONDS = 20

/**
 * Opens the QR on any touch of the display and closes it once
 * `QR_REVEAL_SECONDS` pass without another. Returns `null` while closed, or
 * the count of touches since it opened, which changes on every touch that
 * restarts the time.
 */
export const useQrReveal = (): number | null => {
  const [touchCount, setTouchCount] = useState<number | null>(null)

  useEffect(() => {
    const reveal = () => setTouchCount((count) => (count ?? 0) + 1)

    window.addEventListener('pointerdown', reveal)

    return () => window.removeEventListener('pointerdown', reveal)
  }, [])

  useEffect(() => {
    if (touchCount === null) {
      return
    }

    const timer = setTimeout(
      () => setTouchCount(null),
      QR_REVEAL_SECONDS * 1000
    )

    return () => clearTimeout(timer)
  }, [touchCount])

  return touchCount
}
