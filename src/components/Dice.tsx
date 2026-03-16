import { useState, useCallback } from 'react';
import { useTranslation } from '../i18n';

interface DiceProps {
  onRoll: () => void;
  disabled: boolean;
  die1: number;
  die2: number;
  isDoubles: boolean;
}

const DOT_POSITIONS: Record<number, [number, number][]> = {
  1: [[50, 50]],
  2: [[25, 25], [75, 75]],
  3: [[25, 25], [50, 50], [75, 75]],
  4: [[25, 25], [75, 25], [25, 75], [75, 75]],
  5: [[25, 25], [75, 25], [50, 50], [25, 75], [75, 75]],
  6: [[25, 25], [75, 25], [25, 50], [75, 50], [25, 75], [75, 75]],
};

function DieFace({ value, rolling }: { value: number; rolling: boolean }) {
  const dots = DOT_POSITIONS[value] || [];
  return (
    <div className={`die-face ${rolling ? 'die-rolling' : ''}`}>
      {dots.map(([x, y], i) => (
        <div
          key={i}
          className="die-dot"
          style={{ left: `${x}%`, top: `${y}%` }}
        />
      ))}
    </div>
  );
}

export default function Dice({ onRoll, disabled, die1, die2, isDoubles }: DiceProps) {
  const { t } = useTranslation();
  const [rolling, setRolling] = useState(false);
  const [animDie1, setAnimDie1] = useState(die1 || 1);
  const [animDie2, setAnimDie2] = useState(die2 || 1);

  const handleRoll = useCallback(() => {
    if (disabled || rolling) return;
    setRolling(true);

    const interval = setInterval(() => {
      setAnimDie1(Math.floor(Math.random() * 6) + 1);
      setAnimDie2(Math.floor(Math.random() * 6) + 1);
    }, 80);

    setTimeout(() => {
      clearInterval(interval);
      setRolling(false);
      onRoll();
    }, 700);
  }, [disabled, rolling, onRoll]);

  const displayDie1 = rolling ? animDie1 : (die1 || 1);
  const displayDie2 = rolling ? animDie2 : (die2 || 1);

  return (
    <div className="dice-container">
      <div className="dice-faces">
        <DieFace value={displayDie1} rolling={rolling} />
        <DieFace value={displayDie2} rolling={rolling} />
      </div>
      {isDoubles && !rolling && die1 > 0 && (
        <div className="doubles-badge">🎯 {t('doubles')}!</div>
      )}
      <button
        className="btn btn-roll"
        onClick={handleRoll}
        disabled={disabled || rolling}
      >
        {rolling ? '🎲 ...' : `🎲 ${t('controls.rollDice')}`}
      </button>
    </div>
  );
}
