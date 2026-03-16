import { SPACES } from '../data/spaces'
import { KIDS_SPACES } from '../data/spaces-kids'
import { GROUP_COLORS, PLAYER_COLORS } from '../data/constants'
import { KIDS_SPACE_EMOJIS } from '../data/constants-kids'
import { useTranslation } from '../i18n'
import type { Player, GameMode } from '../game/useGame'

interface Props {
  mode: GameMode
  players: Player[]
  ownership: (number | null)[]
  onSpaceClick: (index: number) => void
}

// Classic: 11×11 grid, 40 spaces
function getClassicGridPosition(index: number): { row: number; col: number } {
  if (index <= 10) return { row: 11, col: 11 - index }
  if (index <= 20) return { row: 11 - (index - 10), col: 1 }
  if (index <= 30) return { row: 1, col: index - 20 + 1 }
  return { row: index - 30 + 1, col: 11 }
}

// Kids: 6×6 grid, 20 spaces around perimeter
function getKidsGridPosition(index: number): { row: number; col: number } {
  if (index <= 5) return { row: 6, col: 6 - index }       // bottom: right to left
  if (index <= 10) return { row: 6 - (index - 5), col: 1 } // left: bottom to top
  if (index <= 15) return { row: 1, col: index - 10 + 1 }  // top: left to right (shifted)
  return { row: index - 15 + 1, col: 6 }                    // right: top to bottom (shifted)
}

function getSide(index: number, boardSize: number): string {
  if (boardSize === 20) {
    if (index > 0 && index < 5) return 'bottom'
    if (index > 5 && index < 10) return 'left'
    if (index > 10 && index < 15) return 'top'
    if (index > 15) return 'right'
    return ''
  }
  if (index > 0 && index < 10) return 'bottom'
  if (index > 10 && index < 20) return 'left'
  if (index > 20 && index < 30) return 'top'
  if (index > 30) return 'right'
  return ''
}

function getCornerIndices(boardSize: number): number[] {
  return boardSize === 20 ? [0, 5, 10, 15] : [0, 10, 20, 30]
}

export function Board({ mode, players, ownership, onSpaceClick }: Props) {
  const { t } = useTranslation()
  const isKids = mode === 'kids'
  const spaces = isKids ? KIDS_SPACES : SPACES
  const boardSize = spaces.length
  const gridSize = isKids ? 6 : 11
  const corners = getCornerIndices(boardSize)
  const getPos = isKids ? getKidsGridPosition : getClassicGridPosition

  const playersAtPosition = (pos: number) =>
    players.filter(p => p.position === pos && !p.bankrupt)

  return (
    <div
      className={`board ${isKids ? 'board-kids' : ''}`}
      style={{
        gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
        gridTemplateRows: `repeat(${gridSize}, 1fr)`,
      }}
    >
      {spaces.map((space, i) => {
        const { row, col } = getPos(i)
        const owner = ownership[i]
        const color = space.group ? GROUP_COLORS[space.group] : undefined
        const isCorner = corners.includes(i)
        const side = getSide(i, boardSize)
        const emoji = isKids ? KIDS_SPACE_EMOJIS[i] : undefined

        return (
          <div
            key={i}
            className={`cell ${isCorner ? 'corner' : ''} ${side} ${isKids ? 'cell-kids' : ''}`}
            style={{ gridRow: row, gridColumn: col }}
            onClick={() => onSpaceClick(i)}
          >
            {color && <div className="cell-color-bar" style={{ backgroundColor: color }} />}
            {isKids && emoji && <div className="cell-emoji">{emoji}</div>}
            <div className="cell-name">{t(space.nameKey)}</div>
            {space.price !== undefined && (
              <div className="cell-price">${space.price}</div>
            )}
            {owner !== null && (
              <div className="cell-owner-dot" style={{ backgroundColor: PLAYER_COLORS[owner] }} />
            )}
            <div className="cell-tokens">
              {playersAtPosition(i).map(p => (
                <div
                  key={p.index}
                  className="token"
                  style={{ backgroundColor: PLAYER_COLORS[p.index] }}
                />
              ))}
            </div>
          </div>
        )
      })}
      <div
        className="board-center"
        style={{
          gridRow: `2 / ${gridSize}`,
          gridColumn: `2 / ${gridSize}`,
        }}
      >
        <div className="center-logo">{isKids ? '🎈' : '🎩'}</div>
        <div className="center-text">
          {isKids ? t('setup.title') + ' Kids' : t('setup.title')}
        </div>
      </div>
    </div>
  )
}
