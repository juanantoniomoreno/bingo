'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSocket } from '@/hooks/useSocket';
import type { ErrorPayload } from '@/types';

type Mode = 'crear' | 'unirse';

export function LobbyForm() {
  const router = useRouter();
  const { emit, onEvent, connected } = useSocket();
  const [mode, setMode] = useState<Mode>('crear');
  const [name, setName] = useState('');
  const [gameId, setGameId] = useState('');
  const [cardCount, setCardCount] = useState(1);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const validateName = (value: string): boolean => {
    return /^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ ]{1,20}$/.test(value.trim());
  };

  const validateGameId = (value: string): boolean => {
    return /^[a-zA-Z0-9]{6}$/.test(value.trim());
  };

  const handleCreate = () => {
    if (!validateName(name)) {
      setError(
        'El nombre debe tener entre 1 y 20 caracteres (letras, números, espacios)'
      );
      return;
    }
    setError('');
    setLoading(true);

    const cleanupCreated = onEvent('gameCreated', ({ gameId }) => {
      cleanupCreated();
      cleanupError();
      sessionStorage.setItem('bingo_role', 'dispensador');
      sessionStorage.setItem('bingo_gameId', gameId);
      sessionStorage.setItem('bingo_playerName', name.trim());
      setLoading(false);
      router.push(`/game/${gameId}`);
    });

    const cleanupError = onEvent('error', (payload: ErrorPayload) => {
      cleanupCreated();
      cleanupError();
      setError(payload.message);
      setLoading(false);
    });

    emit('createGame', { playerName: name.trim() });
  };

  const handleJoin = () => {
    if (!validateName(name)) {
      setError('El nombre debe tener entre 1 y 20 caracteres');
      return;
    }
    if (!validateGameId(gameId)) {
      setError('El código de partida debe tener 6 caracteres alfanuméricos');
      return;
    }
    setError('');
    setLoading(true);

    const cleanupJoined = onEvent('gameJoined', ({ game, playerId, cards }) => {
      cleanupJoined();
      cleanupError();
      sessionStorage.setItem('bingo_role', 'player');
      sessionStorage.setItem('bingo_gameId', game.id);
      sessionStorage.setItem('bingo_playerId', playerId);
      sessionStorage.setItem('bingo_cards', JSON.stringify(cards));
      sessionStorage.setItem('bingo_drawnNumbers', JSON.stringify(game.drawnNumbers));
      sessionStorage.setItem('bingo_lineCalled', JSON.stringify(game.lineCalled));
      sessionStorage.setItem('bingo_bingoCalled', JSON.stringify(game.bingoCalled));
      sessionStorage.setItem('bingo_status', game.status);
      setLoading(false);
      router.push(`/game/${game.id}`);
    });

    const cleanupError = onEvent('error', (payload: ErrorPayload) => {
      cleanupJoined();
      cleanupError();
      setError(payload.message);
      setLoading(false);
    });

    emit('joinGame', {
      gameId: gameId.trim().toLowerCase(),
      playerName: name.trim(),
      cardCount,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'crear') {
      handleCreate();
    } else {
      handleJoin();
    }
  };

  return (
    <div className="w-full max-w-sm mx-auto">
      {/* Mode toggle */}
      <div className="flex rounded-lg bg-gray-100 p-1 mb-6">
        <button
          type="button"
          onClick={() => {
            setMode('crear');
            setError('');
          }}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            mode === 'crear'
              ? 'bg-white text-primary-700 shadow-sm'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Crear Partida
        </button>
        <button
          type="button"
          onClick={() => {
            setMode('unirse');
            setError('');
          }}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            mode === 'unirse'
              ? 'bg-white text-primary-700 shadow-sm'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Unirse
        </button>
      </div>

      {!connected && (
        <div className="mb-4 p-3 bg-yellow-50 text-yellow-800 rounded-lg text-sm text-center">
          Conectando al servidor...
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === 'unirse' && (
          <>
            <div>
              <label
                htmlFor="gameId"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Código de Partida
              </label>
              <input
                id="gameId"
                type="text"
                value={gameId}
                onChange={(e) => setGameId(e.target.value.toUpperCase())}
                placeholder="ABC123"
                maxLength={6}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-center text-lg font-mono tracking-widest uppercase transition-all"
              />
            </div>
            <div>
              <label
                htmlFor="cardCount"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Cantidad de Cartones
              </label>
              <select
                id="cardCount"
                value={cardCount}
                onChange={(e) => setCardCount(Number(e.target.value))}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none bg-white transition-all"
              >
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>
                    {n} {n === 1 ? 'cartón' : 'cartones'}
                  </option>
                ))}
              </select>
            </div>
          </>
        )}

        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Tu Nombre
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Juan"
            maxLength={20}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
          />
        </div>

        {error && (
          <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !connected}
          className="w-full py-3 px-4 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 text-white font-semibold rounded-lg transition-colors focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
        >
          {loading
            ? 'Cargando...'
            : mode === 'crear'
            ? 'Crear Partida'
            : 'Unirse a Partida'}
        </button>
      </form>
    </div>
  );
}
