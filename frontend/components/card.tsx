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

  const canMark = (cellIndex: number) => {
    if (disabled) return false;
    const num = card.numbers[cellIndex];
    return num > 0 && isDrawn(num) && !card.marked[cellIndex];
  };

  const colors = getCardColors(cardIndex);

  return (
    <div
      className="relative bg-white border-2 rounded-xl shadow-md overflow-hidden w-full min-w-[360px]"
      style={{ borderColor: colors.border }}
    >
      {/* Corner label */}
      <span
        className="absolute top-1.5 left-2 text-[10px] font-bold opacity-60 z-10 select-none"
        style={{ color: colors.text }}
      >
        C{cardIndex + 1}
      </span>

      {/* 9-column grid body */}
      <div
        className="grid grid-cols-9 gap-px pt-5 pb-1 px-1"
        style={{ backgroundColor: colors.gridBg }}
      >
        {Array.from({ length: 3 }, (_, row) =>
          Array.from({ length: 9 }, (_, col) => {
            const cellIndex = getCellIndex(col, row);
            const number = card.numbers[cellIndex];
            const marked = card.marked[cellIndex];
            const drawn = number > 0 && isDrawn(number);
            const clickable = canMark(cellIndex);

            return (
              <button
                key={cellIndex}
                onClick={() => clickable && onMark(cardIndex, cellIndex)}
                disabled={!clickable}
                className={`
                  relative aspect-square flex items-center justify-center
                  text-xl sm:text-3xl font-extrabold
                  transition-all duration-150
                  min-w-[38px] min-h-[38px] sm:min-w-[48px] sm:min-h-[48px]
                  touch-manipulation
                  ${
                    number === 0
                      ? 'bg-gray-50/50 cursor-default cell-empty'
                      : marked
                        ? 'cursor-default'
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
                    ? `Número ${number}${marked ? ' (marcado)' : ''}`
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