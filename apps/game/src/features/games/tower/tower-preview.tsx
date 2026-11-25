import type React from 'react'

import type { GamePreviewProps } from '../game-definition'

import './tower-preview.sass'

/**
 * The empty alcove the tower's scene opens on: the bedroom wall shows through,
 * and the scene adds the chart and the blocks once it loads. Nothing to frame,
 * so nothing jumps when it takes over.
 */
export const TowerPreview: React.FC<GamePreviewProps> = () => (
  <div className='tower-preview' />
)
