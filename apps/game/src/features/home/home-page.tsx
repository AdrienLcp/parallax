import type React from 'react'
import { Suspense, useState } from 'react'
import { Link } from 'react-aria-components'
import { useNavigate, useNavigation } from 'react-router'

import { useBackdropTone } from '@/features/display-tuning/use-backdrop-tone'
import { FullscreenSwitch } from '@/features/fullscreen/fullscreen-switch'
import { DEFAULT_GAME_ID, GAME_IDS, games } from '@/features/games/games'
import { screenPathFor, useGameParam } from '@/infrastructure/router/navigation'
import { Main } from '@/presentation/components/main'
import { Spinner } from '@/presentation/components/spinner'
import { useTranslate } from '@/presentation/i18n/i18n-provider'

import { GameTabs } from './game-tabs'

import './home-page.sass'

/**
 * The game choice, on the office display: the chosen game playing by itself,
 * how it plays, and the one way in, opening its room. A row of plaques picks
 * the game once the app hosts more than one.
 */
export const HomePage: React.FC = () => {
  const translate = useTranslate()
  const askedGame = useGameParam()
  const [gameId, setGameId] = useState(askedGame ?? DEFAULT_GAME_ID)
  const game = games[gameId]
  const navigate = useNavigate()
  const openRoom = () => void navigate(screenPathFor(gameId))
  // The room's page loads before it shows: the button turns as soon as it is pressed.
  const isOpening = useNavigation().state !== 'idle'
  // Its lettering stands straight on the game's backdrop: dark on a light one.
  useBackdropTone('var(--host-backdrop)')

  return (
    <Main className='home-page' data-game={gameId}>
      <title>{translate('home.title')}</title>
      <div className='home-display'>
        <header className='home-head'>
          {GAME_IDS.length > 1 && (
            <GameTabs onSelect={setGameId} selected={gameId} />
          )}
          <div className='game-head'>
            <h1 className='game-name'>{translate(game.name)}</h1>
            <FullscreenSwitch />
            <p className='game-players'>
              {translate('screen.players', {
                fewest: game.players.fewest,
                most: game.players.most
              })}
            </p>
          </div>
        </header>
        <div
          aria-hidden='true'
          className='game-showcase'
          key={gameId}
          onClick={openRoom}
        >
          <Suspense fallback={<game.Preview isShowcase />}>
            <game.Showcase />
          </Suspense>
        </div>
        <div className='home-foot'>
          <game.Cues />
          <Link
            aria-busy={isOpening}
            className='open-room'
            href={screenPathFor(gameId)}
          >
            {isOpening && <Spinner />}
            {translate('home.open')}
          </Link>
        </div>
      </div>
    </Main>
  )
}
