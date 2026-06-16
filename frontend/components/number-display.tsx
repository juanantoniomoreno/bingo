'use client';

import { useEffect, useRef, useState } from 'react';

interface NumberDisplayProps {
  drawnNumbers: number[];
}

export function NumberDisplay({ drawnNumbers }: NumberDisplayProps) {
  const [flashNumber, setFlashNumber] = useState<number | null>(null);
  const prevLengthRef = useRef(drawnNumbers.length);
  const scrollRef = useRef<HTMLDivElement>(null);

  // All numbers, newest first (left)
  const allNumbers = [...drawnNumbers].reverse();

  // Auto-scroll to start (newest) when a new number is added
  useEffect(() => {
    if (drawnNumbers.length > prevLengthRef.current && scrollRef.current) {
      scrollRef.current.scrollLeft = 0;
    }
  }, [drawnNumbers.length]);

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
      {/* Counter */}
      <div className="flex justify-end mb-1.5">
        <span className="text-xs text-wood-dark/60 font-medium tabular-nums">
          {drawnNumbers.length}/90
        </span>
      </div>

      {/* Balls */}
      <div
        ref={scrollRef}
        className="flex gap-1.5 sm:gap-2 overflow-x-auto pb-2 snap-x bg-wood-dark/20 rounded-xl p-2 inset-slot"
      >
        {allNumbers.map((number, index) => {
          const isLatest = index === 0;
          const isRecent = index >= 1 && index <= 4;
          const isFlash = number === flashNumber;

          return (
            <div
              key={`${number}-${index}`}
              className={`
                flex-shrink-0 flex items-center justify-center
                bingo-ball text-wood-dark font-bold
                ${isLatest
                  ? 'w-12 h-12 sm:w-14 sm:h-14 text-lg sm:text-xl'
                  : isRecent
                    ? 'w-9 h-9 sm:w-10 sm:h-10 text-sm sm:text-base'
                    : 'w-7 h-7 sm:w-8 sm:h-8 text-[10px] sm:text-xs opacity-75'
                }
                ${isFlash ? 'animate-ball-pop' : ''}
              `}
            >
              {number}
            </div>
          );
        })}

        {allNumbers.length === 0 && (
          <div className="flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center rounded-full bg-white/20 text-wood-dark/40 text-lg font-bold">
            &mdash;
          </div>
        )}
      </div>
    </div>
  );
}
