'use client';

interface AlertBaseProps {
  cardIndex: number;
  onCall: () => void;
  onCancel: () => void;
}

export function LineAlert({ cardIndex, onCall, onCancel }: AlertBaseProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Alerta de Línea"
        className="bg-wood-texture border-4 border-wood-dark rounded-2xl shadow-2xl p-3 max-w-sm w-full text-center animate-alert-pop"
      >
        <div className="bg-white rounded-xl p-4 sm:p-6">
          <div className="text-4xl sm:text-5xl mb-4" aria-hidden="true">
            🔔
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-amber-600 mb-2">
            ¡LÍNEA!
          </h2>
          <p className="text-gray-600 mb-1">
            ¡Completaste una línea en el cartón {cardIndex + 1}!
          </p>
          <p className="text-sm text-gray-500 mb-6">¿Querés cantar línea?</p>
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 py-3 px-4 rounded-xl border border-metal-mid text-metal-dark font-medium hover:bg-metal-mid/10 transition-colors focus-visible:ring-2 focus-visible:ring-metal-dark"
            >
              Cancelar
            </button>
            <button
              onClick={onCall}
              className="flex-1 py-3 px-4 rounded-xl bg-amber-500 text-white font-bold hover:bg-amber-600 transition-colors shadow-md focus-visible:ring-2 focus-visible:ring-amber-400"
            >
              Cantar Línea
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function BingoAlert({ cardIndex, onCall, onCancel }: AlertBaseProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Alerta de Bingo"
        className="bg-wood-texture border-4 border-wood-dark rounded-2xl shadow-2xl p-3 max-w-sm w-full text-center animate-alert-pop"
      >
        <div className="bg-white rounded-xl p-4 sm:p-6">
          <div className="text-4xl sm:text-5xl mb-4" aria-hidden="true">
            🎉
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-red-600 mb-2">
            ¡BINGO!
          </h2>
          <p className="text-gray-600 mb-1">
            ¡Completaste el cartón {cardIndex + 1}!
          </p>
          <p className="text-sm text-gray-500 mb-6">¿Querés cantar bingo?</p>
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 py-3 px-4 rounded-xl border border-metal-mid text-metal-dark font-medium hover:bg-metal-mid/10 transition-colors focus-visible:ring-2 focus-visible:ring-metal-dark"
            >
              Cancelar
            </button>
            <button
              onClick={onCall}
              className="flex-1 py-3 px-4 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 transition-colors shadow-md focus-visible:ring-2 focus-visible:ring-red-400"
            >
              Cantar Bingo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
