'use client';

import { useEffect, useState } from 'react';
import { useSocket } from '@/hooks/useSocket';
import { GameIdDisplay } from '@/components/game-id-display';
import { BingoBoard } from '@/components/bingo-board';
import { DispensadorControls } from '@/components/dispensador-controls';
import { NumberDisplay } from '@/components/number-display';
import type { GameState, ErrorPayload } from '@/types';

type Role = 'dispensador' | 'player' | null;

export default function GamePage({ params }: { params: { gameId: string } }) {
  const gameId = params.gameId;
  const { emit, onEvent, connected } = useSocket();

  const [role, setRole] = useState<Role>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  // Determine role from session storage on mount
  useEffect(() => {
    const storedRole = sessionStorage.getItem('bingo_role') as Role;
    const storedGameId = sessionStorage.getItem('bingo_gameId');

    if (storedGameId === gameId && storedRole) {
      setRole(storedRole);
    } else {
      setError(
        'No se encontró información de la partida. Volvé al inicio y unite de nuevo.'
      );
    }
    setLoading(false);
  }, [gameId]);

  // Subscribe to socket events
  useEffect(() => {
    if (!gameId) return;

    const cleanups: (() => void)[] = [];

    const cleanupNumberDrawn = onEvent('numberDrawn', ({ drawnNumbers }) => {
      setGameState((prev) =>
        prev ? { ...prev, drawnNumbers } : null
      );
    });
    cleanups.push(cleanupNumberDrawn);

    const cleanupLineToggled = onEvent('lineToggled', ({ lineCalled }) => {
      setGameState((prev) =>
        prev ? { ...prev, lineCalled } : null
      );
    });
    cleanups.push(cleanupLineToggled);

    const cleanupBingoToggled = onEvent('bingoToggled', ({ bingoCalled }) => {
      setGameState((prev) =>
        prev ? { ...prev, bingoCalled } : null
      );
    });
    cleanups.push(cleanupBingoToggled);

    const cleanupGameEnded = onEvent('gameEnded', ({ winner, reason }) => {
      setGameState((prev) =>
        prev ? { ...prev, status: 'ended' } : null
      );
      setError(
        `Partida terminada. Ganador: ${winner} (${
          reason === 'line' ? 'Línea' : 'Bingo'
        })`
      );
    });
    cleanups.push(cleanupGameEnded);

    const cleanupError = onEvent('error', (payload: ErrorPayload) => {
      setError(payload.message);
    });
    cleanups.push(cleanupError);

    return () => {
      cleanups.forEach((c) => c());
    };
  }, [gameId, onEvent]);

  // Initialize game state when role is determined
  useEffect(() => {
    if (role === 'dispensador') {
      setGameState({
        id: gameId,
        status: 'playing',
        players: [],
        dispensadorId: '',
        drawnNumbers: [],
        lineCalled: false,
        bingoCalled: false,
        createdAt: Date.now(),
      });
    }
  }, [role, gameId]);

  const handleToggleNumber = (number: number) => {
    if (!gameId || gameState?.status === 'ended') return;
    if (gameState?.drawnNumbers.includes(number)) return;
    emit('drawNumber', { gameId, number });
  };

  const handleToggleLine = () => {
    if (!gameId || gameState?.status === 'ended') return;
    emit('toggleLine', { gameId });
  };

  const handleToggleBingo = () => {
    if (!gameId || gameState?.status === 'ended') return;
    emit('toggleBingo', { gameId });
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-gray-600">Cargando...</p>
      </main>
    );
  }

  if (error && !gameState) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <a
            href="/"
            className="text-primary-600 hover:underline font-medium"
          >
            Volver al inicio
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-3 py-4 sm:px-4 sm:py-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
            Bingo
          </h1>
          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                connected ? 'bg-green-500' : 'bg-red-500'
              }`}
            />
            <span className="text-xs text-gray-500">
              {connected ? 'Conectado' : 'Desconectado'}
            </span>
          </div>
        </div>

        {/* Game ID for dispensador */}
        {role === 'dispensador' && <GameIdDisplay gameId={gameId} />}

        {/* Error toast */}
        {error && (
          <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Number display */}
        {gameState && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 sm:p-4">
            <p className="text-xs text-gray-500 mb-2 uppercase tracking-wide font-medium">
              Últimos números
            </p>
            <NumberDisplay drawnNumbers={gameState.drawnNumbers} />
          </div>
        )}

        {/* Dispensador view */}
        {role === 'dispensador' && gameState && (
          <>
            <BingoBoard
              drawnNumbers={gameState.drawnNumbers}
              onToggleNumber={handleToggleNumber}
              disabled={gameState.status === 'ended'}
            />
            <DispensadorControls
              lineCalled={gameState.lineCalled}
              bingoCalled={gameState.bingoCalled}
              onToggleLine={handleToggleLine}
              onToggleBingo={handleToggleBingo}
              disabled={gameState.status === 'ended'}
            />
          </>
        )}

        {/* Player placeholder */}
        {role === 'player' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
            <p className="text-gray-600 mb-2">
              Estás jugando como jugador normal.
            </p>
            <p className="text-sm text-gray-500">
              La vista de cartones se implementará en la siguiente fase.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
