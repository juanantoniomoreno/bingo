'use client';

import type { Card as CardType } from '@/types';

interface CardProps {
  card: CardType;
  cardIndex: number;
  drawnNumbers: number[];
  onMark: (cardIndex: number, cellIndex: number) => void;
  disabled?: boolean;
}

/**
 * Converts (col, row) to the flat cellIndex used in the Card arrays.
 * numbers[15] and marked[15] are stored column-major: for col 0→8, for row 0→2.
 */
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

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden w-full min-w-[360px]">
      {/* Card header */}
      <div className="px-3 py-2 sm:px-4 sm:py-2.5 bg-gray-50 border-b border-gray-200">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          Cartón {cardIndex + 1}
        </span>
      </div>

      {/* 9-column grid body */}
      <div className="grid grid-cols-9 gap-px bg-gray-200 p-px">
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
                  text-[11px] sm:text-xs font-bold
                  transition-all duration-150
                  min-w-[38px] min-h-[38px] sm:min-w-[44px] sm:min-h-[44px]
                  touch-manipulation
                  ${
                    number === 0
                      ? 'bg-gray-50 cursor-default'
                      : marked
                        ? 'bg-primary-500 text-white cursor-default shadow-inner'
                        : drawn
                          ? 'bg-amber-50 text-amber-800 cursor-pointer hover:bg-amber-100 active:bg-amber-200 border border-amber-400'
                          : 'bg-white text-gray-600 cursor-default border border-gray-100'
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
