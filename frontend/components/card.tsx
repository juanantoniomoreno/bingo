'use client';

import type { Card as CardType } from '@/types';
import { getCardColors } from '@/lib/card-color';

interface CardProps {
  card: CardType;
  cardIndex: number;
  drawnNumbers: number[];
  onMark: (cardIndex: number, cellIndex: number) => void;
  disabled?: boolean;
}

function getCellIndex(col: number, row: number): number {
  return col * 3 + row;
}

export function BingoCard({
  card,
  cardIndex,
  drawnNumbers,
  onMark,
  disabled,
}: CardProps) {
  const isDrawn = (number: number) => drawnNumbers.includes(number);

  const canToggle = (cellIndex: number) => {
    if (disabled) return false;
    const num = card.numbers[cellIndex];
    if (num <= 0) return false;
    // Si ya está marcada, SIEMPRE se puede desmarcar (incluso si el dispensador quitó la bola)
    if (card.marked[cellIndex]) return true;
    // Si no está marcada, solo se puede marcar si el número salió
    return isDrawn(num);
  };

  const colors = getCardColors(cardIndex);

  return (
    <div
      className="relative bg-white border-2 rounded-xl shadow-md overflow-hidden w-full"
      style={{ borderColor: colors.border }}
    >
      {/* Corner label */}
      <span
        className="absolute top-1 left-1.5 sm:top-1.5 sm:left-2 text-[9px] sm:text-[10px] font-bold opacity-60 z-10 select-none"
        style={{ color: colors.text }}
      >
        C{cardIndex + 1}
      </span>

      {/* 9-column grid body */}
      <div
        className="grid grid-cols-9 gap-px pt-4 sm:pt-5 pb-1 px-0.5 sm:px-1"
        style={{ backgroundColor: colors.gridBg }}
      >
        {Array.from({ length: 3 }, (_, row) =>
          Array.from({ length: 9 }, (_, col) => {
            const cellIndex = getCellIndex(col, row);
            const number = card.numbers[cellIndex];
            const marked = card.marked[cellIndex];
            const drawn = number > 0 && isDrawn(number);
            const clickable = canToggle(cellIndex);

            return (
              <button
                key={cellIndex}
                onClick={() => clickable && onMark(cardIndex, cellIndex)}
                disabled={!clickable}
                className={`
                  relative aspect-square flex items-center justify-center
                  text-base sm:text-xl md:text-2xl font-extrabold
                  transition-all duration-150
                  touch-manipulation
                  ${
                    number === 0
                      ? 'bg-gray-50/50 cursor-default cell-empty'
: marked
                         ? 'bg-white cursor-pointer hover:brightness-110'
                        : drawn
                          ? 'bg-white cursor-pointer hover:brightness-110 active:brightness-90'
                          : 'bg-white cursor-default'
                  }
                `}
                style={
                  number === 0
                    ? undefined
                    : marked
                      ? { color: colors.text }
                      : drawn
                        ? {
                            color: colors.text,
                            border: `1px solid ${colors.border}66`,
                          }
                        : { color: colors.text }
                }
                aria-label={
                  number > 0
                    ? `Número ${number}${marked ? ' (marcado, clic para desmarcar)' : ''}`
                    : 'Celda vacía'
                }
              >
                {number > 0 ? (
                  <>
                    <span className="relative z-0">{number}</span>
                    {marked && (
                      <div className="absolute inset-0 z-10 flex items-center justify-center">
                        <div
                          className="w-[85%] h-[85%] rounded-full shadow-sm"
                          style={{
                            background: `radial-gradient(circle at 35% 35%, rgba(210,180,140,0.65) 0%, rgba(196,168,130,0.55) 50%, rgba(139,105,20,0.45) 100%)`,
                          }}
                        />
                      </div>
                    )}
                  </>
                ) : null}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}