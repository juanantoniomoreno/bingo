'use client';

import { useEffect, useRef, useState } from 'react';

interface NumberDisplayProps {
  drawnNumbers: number[];
}

export function NumberDisplay({ drawnNumbers }: NumberDisplayProps) {
  const [flashNumber, setFlashNumber] = useState<number | null>(null);
  const prevLengthRef = useRef(drawnNumbers.length);

  // Get last 10 numbers, newest first (left)
  const lastTen = [...drawnNumbers].reverse().slice(0, 10);

  useEffect(() => {
    if (drawnNumbers.length > prevLengthRef.current) {
      const newest = drawnNumbers[drawnNumbers.length - 1];
      setFlashNumber(newest);
      const timer = setTimeout(() => setFlashNumber(null), 800);
      prevLengthRef.current = drawnNumbers.length;
      return () => clearTimeout(timer);
    }
  }, [drawnNumbers]);

  return (
    <div className="w-full">
      <div className="flex gap-2 overflow-x-auto pb-2 snap-x bg-wood-dark/20 rounded-xl p-2 inset-slot">
        {lastTen.map((number, index) => {
          const isLatest = index === 0;
          const isFlash = number === flashNumber;

          return (
            <div
              key={`${number}-${index}`}
              className={`
                flex-shrink-0 flex items-center justify-center
                bingo-ball text-wood-dark font-bold
                ${isLatest
                  ? 'w-12 h-12 sm:w-14 sm:h-14 text-lg sm:text-xl'
                  : 'w-9 h-9 sm:w-10 sm:h-10 text-sm sm:text-base'
                }
                ${isFlash ? 'animate-ball-pop' : ''}
              `}
            >
              {number}
            </div>
          );
        })}

        {lastTen.length === 0 && (
          <div className="flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center rounded-full bg-white/20 text-wood-dark/40 text-lg font-bold">
            &mdash;
          </div>
        )}
      </div>
    </div>
  );
}
