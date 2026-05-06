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
        onClick={onToggleBingo}
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
  );
}
