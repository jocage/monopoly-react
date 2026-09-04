import { useState } from 'react'
import { useTranslation } from '../i18n'
import { LanguageSwitcher } from './LanguageSwitcher'
import { PLAYER_COLORS } from '../data/constants'
import type { GameMode } from '../game/useGame'
import type { MultiplayerActions, MultiplayerState } from '../game/multiplayer'

interface Props {
  mp: MultiplayerState & MultiplayerActions
  onLeave: () => void
  initialCode?: string
}

export function Lobby({ mp, onLeave, initialCode }: Props) {
  const { t } = useTranslation()
  const [joinCode, setJoinCode] = useState(initialCode ?? '')
  const [createMode, setCreateMode] = useState<GameMode>('classic')
  const [copied, setCopied] = useState<'code' | 'link' | null>(null)

  const showJoinForm = mp.phase === 'idle' || (mp.phase === 'error' && !mp.room)
  const showCreated = mp.room !== null && !mp.room.started && mp.myIndex === 0
  const showJoined = mp.room !== null && !mp.room.started && mp.myIndex !== null && mp.myIndex !== 0

  const shareUrl = mp.room ? `${window.location.origin}/room/${mp.room.code}` : ''

  async function copyToClipboard(text: string, kind: 'code' | 'link'): Promise<void> {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(kind)
      setTimeout(() => setCopied(null), 1500)
    } catch {
      // ignore — older browsers / insecure contexts
    }
  }

  return (
    <div className="lobby">
      <header className="lobby-header">
        <button className="lobby-back" onClick={onLeave}>← {t('landing.back')}</button>
        <LanguageSwitcher />
      </header>

      <h1 className="lobby-title">{t('lobby.title')}</h1>

      {mp.error && <p className="lobby-error" role="alert">{mp.error}</p>}
      {!mp.connected && <p className="lobby-disconnected">{t('lobby.disconnected')}</p>}

      {showJoinForm && (
        <div className="lobby-grid">
          <section className="lobby-card">
            <h2>{t('lobby.create.title')}</h2>
            <div className="lobby-mode-picker">
              <label className={createMode === 'classic' ? 'active' : ''}>
                <input
                  type="radio"
                  name="mode"
                  value="classic"
                  checked={createMode === 'classic'}
                  onChange={() => setCreateMode('classic')}
                />
                {t('lobby.create.classic')}
              </label>
              <label className={createMode === 'kids' ? 'active' : ''}>
                <input
                  type="radio"
                  name="mode"
                  value="kids"
                  checked={createMode === 'kids'}
                  onChange={() => setCreateMode('kids')}
                />
                {t('lobby.create.kids')}
              </label>
            </div>
            <button
              className="btn lobby-create-btn"
              onClick={() => mp.createRoom(createMode)}
              disabled={mp.phase === 'connecting'}
            >
              {t('lobby.create.button')}
            </button>
          </section>

          <section className="lobby-card">
            <h2>{t('lobby.join.title')}</h2>
            <label className="lobby-field">
              <span>{t('lobby.join.codeLabel')}</span>
              <input
                type="text"
                value={joinCode}
                placeholder={t('lobby.join.codePlaceholder')}
                onChange={e => setJoinCode(e.target.value.toUpperCase())}
                maxLength={8}
              />
            </label>
            <button
              className="btn lobby-join-btn"
              onClick={() => mp.joinRoom(joinCode)}
              disabled={mp.phase === 'connecting' || joinCode.trim().length === 0}
            >
              {t('lobby.join.button')}
            </button>
          </section>
        </div>
      )}

      {mp.room && (
        <section className="lobby-room">
          <div className="lobby-code-block">
            <span className="lobby-code-label">{t('lobby.codeLabel')}</span>
            <span className="lobby-code-value">{mp.room.code}</span>
            <div className="lobby-code-actions">
              <button
                className="btn lobby-copy-btn"
                onClick={() => copyToClipboard(mp.room!.code, 'code')}
              >
                {copied === 'code' ? `✓ ${t('lobby.copied')}` : t('lobby.copyCode')}
              </button>
              <button
                className="btn lobby-copy-btn"
                onClick={() => copyToClipboard(shareUrl, 'link')}
              >
                {copied === 'link' ? `✓ ${t('lobby.copied')}` : t('lobby.copyLink')}
              </button>
            </div>
          </div>

          <p className="lobby-share-hint">{t('lobby.shareWithFriends')}</p>

          <h2>{t('lobby.players')}</h2>
          <div className="lobby-slots">
            {mp.slots.map(slot => {
              const isHost = slot.index === 0
              return (
                <div
                  key={slot.index}
                  className={`lobby-slot ${slot.takenByMe ? 'is-me' : ''} ${slot.taken ? 'taken' : 'empty'}`}
                  style={{ borderColor: PLAYER_COLORS[slot.index] }}
                >
                  <span className="lobby-slot-chip" style={{ backgroundColor: PLAYER_COLORS[slot.index] }} />
                  <span className="lobby-slot-label">
                    P{slot.index + 1}
                    {isHost && ' ★'}
                  </span>
                  <span className="lobby-slot-state">
                    {slot.takenByMe
                      ? t('lobby.slotYou')
                      : slot.taken
                        ? t('lobby.slotTaken')
                        : t('lobby.slotEmpty')}
                  </span>
                </div>
              )
            })}
          </div>

          <p className="lobby-role">
            {mp.myIndex === 0
              ? t('lobby.youAreHost')
              : mp.myIndex !== null
                ? t('lobby.youArePlayer', { slot: `P${mp.myIndex + 1}` })
                : t('lobby.spectator')}
          </p>

          {!mp.room.started && (
            <p className="lobby-waiting">{t('lobby.waiting')}</p>
          )}

          {showCreated && (
            <button
              className="btn lobby-start-btn"
              onClick={() => mp.startGame()}
              disabled={mp.slots.filter(s => s.taken).length < 2}
            >
              {t('lobby.startGame')}
            </button>
          )}

          {showJoined && <p className="lobby-not-host">{t('lobby.notHost')}</p>}
        </section>
      )}
    </div>
  )
}
