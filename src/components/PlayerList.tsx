import { useTranslation } from '../i18n'
import { PLAYER_COLORS } from '../data/constants'
import type { Player, GameMode } from '../game/useGame'

interface Props {
  players: Player[]
  currentPlayer: number
  mode: GameMode
}

export function PlayerList({ players, currentPlayer, mode }: Props) {
  const { t } = useTranslation()
  const isKids = mode === 'kids'

  return (
    <div className="player-list">
      <h3>{t('sidebar.players')}</h3>
      {players.map(p => (
        <div
          key={p.index}
          className={`player-row ${p.index === currentPlayer ? 'active' : ''} ${p.bankrupt ? 'bankrupt' : ''}`}
        >
          <div className="player-color" style={{ backgroundColor: PLAYER_COLORS[p.index] }} />
          <div className="player-info">
            <span className="player-name">
              P{p.index + 1}
              {p.inJail && <span className="player-status"> {isKids ? t('sidebar.inNap') : t('sidebar.inJail')}</span>}
              {p.bankrupt && <span className="player-status"> {t('sidebar.bankrupt')}</span>}
            </span>
            <span className="player-money">${p.money}</span>
            <span className="player-props">{p.properties.length} {t('sidebar.properties')}</span>
          </div>
        </div>
      ))}
    </div>
  )
}
