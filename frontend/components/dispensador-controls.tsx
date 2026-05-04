'use client';

interface DispensadorControlsProps {
  lineCalled: boolean;
  bingoCalled: boolean;
  onToggleLine: () => void;
  onToggleBingo: () => void;
  disabled?: boolean;
}

export function DispensadorControls({
  lineCalled,
  bingoCalled,
  onToggleLine,
  onToggleBingo,
  disabled,
}: DispensadorControlsProps) {
  return (
    <div className="flex gap-3 sm:gap-4 justify-center">
      <button
        onClick={onToggleLine}
        disabled={disabled}
        className={`
          flex-1 max-w-[160px] py-3 px-4 sm:py-4 sm:px-6 rounded-xl font-bold text-sm sm:text-base
          transition-all duration-200 active:scale-95
          ${
            lineCalled
              ? 'bg-amber-500 text-white shadow-lg ring-2 ring-amber-300'
              : 'bg-white text-amber-700 border-2 border-amber-500 hover:bg-amber-50'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
      >
        {lineCalled ? '🔔 Línea Cantada' : '📢 Cantar Línea'}
      </button>

      <button
        onClick={onToggleBingo}
        disabled={disabled}
        className={`
          flex-1 max-w-[160px] py-3 px-4 sm:py-4 sm:px-6 rounded-xl font-bold text-sm sm:text-base
          transition-all duration-200 active:scale-95
          ${
            bingoCalled
              ? 'bg-red-600 text-white shadow-lg ring-2 ring-red-300'
              : 'bg-white text-red-700 border-2 border-red-500 hover:bg-red-50'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
      >
        {bingoCalled ? '🎉 Bingo Cantado' : '🎯 Cantar Bingo'}
      </button>
    </div>
  );
}
