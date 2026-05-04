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
      <div className="flex gap-2 overflow-x-auto pb-2 snap-x">
        {lastTen.map((number, index) => (
          <div
            key={`${number}-${index}`}
            className={`
              flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14
              flex items-center justify-center
              rounded-full text-lg sm:text-xl font-bold
              transition-all duration-300
              ${
                number === flashNumber
                  ? 'bg-green-500 text-white scale-110 shadow-lg'
                  : index === 0
                  ? 'bg-primary-600 text-white shadow-md'
                  : 'bg-primary-100 text-primary-800'
              }
            `}
          >
            {number}
          </div>
        ))}

        {lastTen.length === 0 && (
          <div className="flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center rounded-full bg-gray-100 text-gray-400 text-sm">
            -
          </div>
        )}
      </div>
    </div>
  );
}
