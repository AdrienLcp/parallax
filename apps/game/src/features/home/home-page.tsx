import type React from 'react'
import { Suspense, useState } from 'react'
import { Link } from 'react-aria-components'
import { useNavigate } from 'react-router'

import { FullscreenSwitch } from '@/features/fullscreen/fullscreen-switch'
import { CURRENT_GAME, GAME_IDS, games } from '@/features/games/games'
import { paths } from '@/infrastructure/router/navigation'
import { Main } from '@/presentation/components/main'
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
  const [gameId, setGameId] = useState(CURRENT_GAME)
  const game = games[gameId]
  const navigate = useNavigate()
  const openRoom = () => void navigate(paths.screen)

  return (
    <Main className='home-page'>
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
          <Link className='open-room' href={paths.screen}>
            {translate('home.open')}
          </Link>
        </div>
      </div>
    </Main>
  )
}
