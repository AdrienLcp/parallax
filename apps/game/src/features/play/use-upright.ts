import { useEffect, useState } from 'react'

const UPRIGHT = '(orientation: portrait)'

/** Whether the phone stands upright, its rotation locked or not turned yet: a pad played in landscape turns itself then. */
export const useUpright = (): boolean => {
  const [isUpright, setUpright] = useState(() => matchMedia(UPRIGHT).matches)
  useEffect(() => {
    const query = matchMedia(UPRIGHT)
    const follow = () => setUpright(query.matches)
    query.addEventListener('change', follow)
    return () => query.removeEventListener('change', follow)
  }, [])
  return isUpright
}
