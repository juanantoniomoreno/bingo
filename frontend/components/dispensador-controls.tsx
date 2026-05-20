'use client';

import { useState } from 'react';

interface DispensadorControlsProps {
  lineCalled: boolean;
  bingoCalled: boolean;
  players: string[];
  onToggleLine: () => void;
  onToggleBingo: (winnerName?: string) => void;
  disabled?: boolean;
}

export function DispensadorControls({
  lineCalled,
  bingoCalled,
  players,
  onToggleLine,
  onToggleBingo,
  disabled,
}: DispensadorControlsProps) {
  const [selectedWinner, setSelectedWinner] = useState('');

  return (
    <div className="flex flex-col gap-3 justify-center">
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
        <button
          onClick={onToggleLine}
          disabled={disabled}
          className={`
            flex-1 max-w-[160px] py-3 px-4 sm:py-4 sm:px-6 rounded-xl font-bold text-sm sm:text-base
            transition-all duration-200 active:scale-95 focus-visible:ring-2 focus-visible:ring-metal-dark
            ${
              lineCalled
                ? 'bg-metal-mid text-white shadow-inner'
                : 'bg-metal-light text-metal-dark border border-metal-mid shadow-[0_2px_0_#71717A] hover:bg-metal-mid/20'
            }
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
        >
          {lineCalled ? '🔔 Línea Cantada' : '📢 Cantar Línea'}
        </button>

        <button
          onClick={() => onToggleBingo(selectedWinner || undefined)}
          disabled={disabled}
          className={`
            flex-1 max-w-[160px] py-3 px-4 sm:py-4 sm:px-6 rounded-xl font-bold text-sm sm:text-base
            transition-all duration-200 active:scale-95 focus-visible:ring-2 focus-visible:ring-metal-dark
            ${
              bingoCalled
                ? 'bg-metal-mid text-white shadow-inner'
                : 'bg-metal-light text-metal-dark border border-metal-mid shadow-[0_2px_0_#71717A] hover:bg-metal-mid/20'
            }
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
        >
          {bingoCalled ? '🎉 Bingo Cantado' : '🎯 Cantar Bingo'}
        </button>
      </div>

      {!bingoCalled && players.length > 0 && (
        <div className="flex justify-center">
          <select
            value={selectedWinner}
            onChange={(e) => setSelectedWinner(e.target.value)}
            disabled={disabled}
            className="max-w-[200px] w-full py-2 px-3 rounded-lg border border-metal-mid bg-white text-sm text-metal-dark focus:outline-none focus:ring-2 focus:ring-metal-dark"
          >
            <option value="">Ganador: yo (dispensador)</option>
            {players.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
