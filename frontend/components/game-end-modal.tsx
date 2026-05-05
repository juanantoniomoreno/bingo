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
      <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 max-w-sm w-full text-center animate-alert-pop">
        {/* Celebratory icon */}
        <div className="text-5xl sm:text-6xl mb-3" aria-hidden="true">
          {reason === 'bingo' ? '🎉' : '🔔'}
        </div>

        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">
          ¡Partida Terminada!
        </h2>

        <p className="text-gray-600 mb-1">
          Ganador: <span className="font-semibold text-primary-700">{winner}</span>
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
            className="flex-1 py-3 px-4 rounded-xl bg-primary-600 text-white font-bold hover:bg-primary-700 transition-colors shadow-md"
          >
            Nueva Partida
          </button>
          <button
            onClick={onExit}
            className="flex-1 py-3 px-4 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
          >
            Salir
          </button>
        </div>
      </div>
    </div>
  );
}
