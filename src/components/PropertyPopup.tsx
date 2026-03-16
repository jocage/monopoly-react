import { useTranslation } from '../i18n'
import { SPACES } from '../data/spaces'
import { KIDS_SPACES } from '../data/spaces-kids'
import { GROUP_COLORS, PLAYER_COLORS } from '../data/constants'
import type { Player, GameMode } from '../game/useGame'

interface Props {
  mode: GameMode
  spaceIndex: number
  ownership: (number | null)[]
  players: Player[]
  onClose: () => void
}

export function PropertyPopup({ mode, spaceIndex, ownership, players, onClose }: Props) {
  const { t } = useTranslation()
  const spaces = mode === 'kids' ? KIDS_SPACES : SPACES
  const space = spaces[spaceIndex]
  const owner = ownership[spaceIndex]
  const color = space.group ? GROUP_COLORS[space.group] : '#999'

  const hasDetails = space.type === 'property' || space.type === 'railroad' || space.type === 'utility'

  return (
    <div className="popup-overlay" onClick={onClose}>
      <div className="popup" onClick={e => e.stopPropagation()}>
        <div className="popup-header" style={{ backgroundColor: color }}>
          {t(space.nameKey)}
        </div>
        <div className="popup-body">
          {hasDetails ? (
            <>
              {space.price && <p>{t('popup.price')}: ${space.price}</p>}
              {space.rent !== undefined && space.type !== 'utility' && (
                <p>{t('popup.rent')}: ${space.rent}</p>
              )}
              {space.groupKey && <p>{t('popup.group')}: {t(space.groupKey)}</p>}
              {space.mortgage && <p>{t('popup.mortgage')}: ${space.mortgage}</p>}
              <p>
                {t('popup.owner')}:{' '}
                {owner !== null ? (
                  <span style={{ color: PLAYER_COLORS[owner], fontWeight: 'bold' }}>
                    P{owner + 1}
                  </span>
                ) : (
                  t('popup.none')
                )}
              </p>
            </>
          ) : (
            <p>{t(space.nameKey)}</p>
          )}
          <div className="popup-actions">
            <button className="btn btn-close" onClick={onClose}>{t('popup.close')}</button>
          </div>
        </div>
      </div>
    </div>
  )
}
