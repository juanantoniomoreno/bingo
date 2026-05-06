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
          const isFlash = number === flashNumber;
          if (isFlash) {
            return (
              <div
                key={`${number}-${index}`}
                className="flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 bingo-ball text-lg sm:text-xl font-bold text-wood-dark animate-ball-pop"
              >
                {number}
              </div>
            );
          }
          if (index === 0) {
            return (
              <div
                key={`${number}-${index}`}
                className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-full bg-white/80 shadow-sm text-base sm:text-lg font-bold text-wood-dark"
              >
                {number}
              </div>
            );
          }
          return (
            <div
              key={`${number}-${index}`}
              className="flex-shrink-0 w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-full bg-white/60 shadow-sm text-sm sm:text-base font-semibold text-wood-dark/70"
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
