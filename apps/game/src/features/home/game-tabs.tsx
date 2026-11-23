import type React from 'react'
import { ToggleButton, ToggleButtonGroup } from 'react-aria-components'

import { GAME_IDS, type GameId, games } from '@/features/games/games'
import { useTranslate } from '@/presentation/i18n/i18n-provider'

import './game-tabs.sass'

type GameTabsProps = {
  onSelect: (game: GameId) => void
  selected: GameId
}

const isGameId = (key: React.Key): key is GameId =>
  GAME_IDS.some((game) => game === key)

/** One enamel plaque per game the app hosts: the chosen one is enamelled, the others only outlined. */
export const GameTabs: React.FC<GameTabsProps> = ({ onSelect, selected }) => {
  const translate = useTranslate()

  return (
    <ToggleButtonGroup
      aria-label={translate('home.games')}
      className='game-tabs'
      disallowEmptySelection
      onSelectionChange={(keys) => {
        const [key] = keys
        if (key !== undefined && isGameId(key)) onSelect(key)
      }}
      selectedKeys={[selected]}
      selectionMode='single'
    >
      {GAME_IDS.map((game) => (
        <ToggleButton className='game-tab' id={game} key={game}>
          {translate(games[game].name)}
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  )
}
