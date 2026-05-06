'use client';

import type { Card as CardType } from '@/types';
import {
  getCardColorClass,
  getCardBorderClass,
  getCardBgClass,
  getCardGridBgClass,
} from '@/lib/card-color';

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

  const numberColor = getCardColorClass(cardIndex);
  const borderColor = getCardBorderClass(cardIndex);
  const markedBg = getCardBgClass(cardIndex);
  const gridBg = getCardGridBgClass(cardIndex);

  return (
    <div className={`relative bg-white border-2 ${borderColor} rounded-xl shadow-md overflow-hidden w-full min-w-[360px]`}>
      {/* Corner label */}
      <span className={`absolute top-1.5 left-2 ${numberColor} text-[10px] font-bold opacity-60 z-10 select-none`}>
        C{cardIndex + 1}
      </span>

      {/* 9-column grid body */}
      <div className={`grid grid-cols-9 gap-px ${gridBg} pt-5 pb-1 px-1`}>
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
                  aspect-square flex items-center justify-center
                  text-xl sm:text-3xl font-extrabold
                  transition-all duration-150
                  min-w-[38px] min-h-[38px] sm:min-w-[48px] sm:min-h-[48px]
                  touch-manipulation
                  ${
                    number === 0
                      ? 'bg-gray-50/50 cursor-default cell-empty'
                      : marked
                        ? `${numberColor} ${markedBg} cursor-default shadow-inner`
                        : drawn
                          ? `${numberColor} bg-white/80 cursor-pointer hover:brightness-110 active:brightness-90 border ${borderColor}/40`
                          : `${numberColor} bg-white cursor-default`
                  }
                `}
                aria-label={
                  number > 0
                    ? `Número ${number}${marked ? ' (marcado)' : ''}`
                    : 'Celda vacía'
                }
              >
                {number > 0 ? (
                  <span className={marked ? 'line-through decoration-2' : ''}>
                    {number}
                  </span>
                ) : null}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}