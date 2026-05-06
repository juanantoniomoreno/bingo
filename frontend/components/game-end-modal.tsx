'use client';

interface GameEndModalProps {
  winner: string;
  reason: 'line' | 'bingo';
  onNewGame: () => void;
  onExit: () => void;
}

export function GameEndModal({
  winner,
  reason,
  onNewGame,
  onExit,
}: GameEndModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" role="dialog" aria-modal="true" aria-label="Partida terminada">
      <div className="bg-wood-texture border-4 border-wood-dark rounded-2xl shadow-2xl p-3 max-w-sm w-full text-center animate-alert-pop">
        <div className="bg-white rounded-xl p-4 sm:p-6">
          {/* Celebratory icon */}
          <div className="text-5xl sm:text-6xl mb-3" aria-hidden="true">
            {reason === 'bingo' ? '🎉' : '🔔'}
          </div>

          <h2 className="text-xl sm:text-2xl font-bold text-wood-dark mb-1">
            ¡Partida Terminada!
          </h2>

          <p className="text-gray-600 mb-1">
            Ganador: <span className="font-semibold text-wood-dark">{winner}</span>
          </p>

          <p className="text-sm text-gray-500 mb-6">
            {reason === 'bingo'
              ? '¡Bingo completo!'
              : '¡Línea cantada!'}
          </p>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={onNewGame}
              className="flex-1 py-3 px-4 rounded-xl bg-metal-light text-metal-dark font-bold border border-metal-mid shadow-[0_2px_0_#71717A] hover:bg-metal-mid/20 transition-colors focus-visible:ring-2 focus-visible:ring-metal-dark"
            >
              Nueva Partida
            </button>
            <button
              onClick={onExit}
              className="flex-1 py-3 px-4 rounded-xl border border-metal-mid text-metal-dark font-medium hover:bg-metal-mid/10 transition-colors focus-visible:ring-2 focus-visible:ring-metal-dark"
            >
              Salir
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
