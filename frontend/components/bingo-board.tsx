'use client';

import { useCallback } from 'react';

interface BingoBoardProps {
  drawnNumbers: number[];
  onToggleNumber: (number: number) => void;
  disabled?: boolean;
}

export function BingoBoard({
  drawnNumbers,
  onToggleNumber,
  disabled,
}: BingoBoardProps) {
  const isDrawn = useCallback(
    (number: number) => drawnNumbers.includes(number),
    [drawnNumbers]
  );

  const handleClick = (number: number) => {
    if (disabled) return;
    onToggleNumber(number);
  };

  const rows = 10;
  const cols = 9;

  return (
    <div className="w-full overflow-x-auto">
      <div className="inline-block min-w-full">
        <div className="grid grid-cols-9 gap-1 sm:gap-1.5 p-2 sm:p-3 bg-gray-50 rounded-xl">
          {Array.from({ length: rows }, (_, rowIndex) =>
            Array.from({ length: cols }, (_, colIndex) => {
              const number = rowIndex * 9 + colIndex + 1;
              const drawn = isDrawn(number);

              return (
                <button
                  key={number}
                  onClick={() => handleClick(number)}
                  disabled={disabled || drawn}
                  className={`
                    aspect-square flex items-center justify-center
                    text-xs sm:text-sm font-semibold rounded-lg
                    transition-all duration-150 active:scale-95
                    min-w-[38px] min-h-[38px] sm:min-w-[44px] sm:min-h-[44px]
                    touch-manipulation
                    ${
                      drawn
                        ? 'bg-primary-500 text-white shadow-md'
                        : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                    }
                    ${disabled || drawn ? 'cursor-not-allowed' : 'cursor-pointer'}
                  `}
                >
                  {number}
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
