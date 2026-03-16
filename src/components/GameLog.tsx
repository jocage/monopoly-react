import { useTranslation } from '../i18n'
import type { LogEntry } from '../game/useGame'

interface Props {
  log: LogEntry[]
}

export function GameLog({ log }: Props) {
  const { t } = useTranslation()

  function renderLogEntry(entry: LogEntry): string {
    const params = entry.params ? { ...entry.params } : {}
    // Translate nested i18n keys in params (e.g. {space.boardwalk})
    for (const [key, val] of Object.entries(params)) {
      if (typeof val === 'string' && val.startsWith('{') && val.endsWith('}')) {
        const innerKey = val.slice(1, -1)
        params[key] = t(innerKey)
      }
    }
    return t(entry.key, params as Record<string, string | number>)
  }

  return (
    <div className="game-log">
      <h3>{t('sidebar.gameLog')}</h3>
      <div className="log-entries">
        {log.map((entry, i) => (
          <div key={i} className="log-entry">{renderLogEntry(entry)}</div>
        ))}
      </div>
    </div>
  )
}
