'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSocket } from '@/hooks/useSocket';
import { GameIdDisplay } from '@/components/game-id-display';
import { BingoBoard } from '@/components/bingo-board';
import { DispensadorControls } from '@/components/dispensador-controls';
import { NumberDisplay } from '@/components/number-display';
import { BingoCard } from '@/components/card';
import { LineAlert, BingoAlert } from '@/components/alerts';
import { GameEndModal } from '@/components/game-end-modal';
import type {
  GameState,
  Card,
  ErrorPayload,
  GameEndedPayload,
  GameStatus,
  GameStateResponse,
} from '@/types';

type Role = 'dispensador' | 'player' | null;

interface AlertState {
  type: 'line' | 'bingo';
  cardIndex: number;
}

interface GameEndState {
  winner: string;
  reason: 'line' | 'bingo';
}

// ---------------------------------------------------------------------------
// Detection helpers (pure)
// ---------------------------------------------------------------------------

/** Row r has cells at col*3 + r for col in [0..8]. Non-null cells (number > 0). */
function hasLine(card: Card): boolean {
  for (let row = 0; row < 3; row++) {
    const cellsWithNumbers = Array.from({ length: 9 }, (_, col) => col * 3 + row).filter(
      (i) => card.numbers[i] > 0
    );
    // Row is complete only if ALL non-null cells are marked
    if (cellsWithNumbers.length > 0 && cellsWithNumbers.every((i) => card.marked[i])) {
      return true;
    }
  }
  return false;
}

/** Bingo = every non-null cell across all 9 columns is marked. */
function hasBingo(card: Card): boolean {
  return card.numbers.every((n, i) => n === 0 || card.marked[i]);
}

/** Walk all cards and return the first undismissed alert (bingo first, then line). */
function detectAlert(
  cards: Card[],
  lineCalled: boolean,
  bingoCalled: boolean,
  lineAlertsSeen: number[],
  bingoAlertsSeen: number[]
): AlertState | null {
  if (bingoCalled) return null;

  for (let i = 0; i < cards.length; i++) {
    if (hasBingo(cards[i]) && !bingoAlertsSeen.includes(i)) {
      return { type: 'bingo', cardIndex: i };
    }
  }

  if (!lineCalled) {
    for (let i = 0; i < cards.length; i++) {
      if (hasLine(cards[i]) && !lineAlertsSeen.includes(i)) {
        return { type: 'line', cardIndex: i };
      }
    }
  }

  return null;
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default function GamePage({ params }: { params: { gameId: string } }) {
  const gameId = params.gameId;
  const router = useRouter();
  const { emit, onEvent, connected, reconnecting: socketReconnecting } = useSocket();

  // --- Shared state --------------------------------------------------------
  const [role, setRole] = useState<Role>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [gameEnd, setGameEnd] = useState<GameEndState | null>(null);

  // --- Reconnection state ---------------------------------------------------
  const [reconnectedToast, setReconnectedToast] = useState(false);
  const lastConnectedRef = useRef(connected);
  const [unmarkToast, setUnmarkToast] = useState<number | null>(null);

  // --- Player-only state ---------------------------------------------------
  const [cards, setCards] = useState<Card[]>([]);
  const cardsRef = useRef(cards);
  cardsRef.current = cards;
  const [currentAlert, setCurrentAlert] = useState<AlertState | null>(null);
  const [lineAlertsSeen, setLineAlertsSeen] = useState<number[]>([]);
  const [bingoAlertsSeen, setBingoAlertsSeen] = useState<number[]>([]);

  // -------------------------------------------------------------------------
  // Initialisation: determine role from sessionStorage
  // -------------------------------------------------------------------------
  useEffect(() => {
    const storedRole = sessionStorage.getItem('bingo_role') as Role;
    const storedGameId = sessionStorage.getItem('bingo_gameId');

    if (storedGameId !== gameId || !storedRole) {
      // Redirect to landing — this URL doesn't match stored session
      router.replace('/');
      return;
    }

    setRole(storedRole);
    setLoading(false);
  }, [gameId, router]);

  // -------------------------------------------------------------------------
  // Clear session storage helper
  // -------------------------------------------------------------------------
  function clearGameSession() {
    sessionStorage.removeItem('bingo_role');
    sessionStorage.removeItem('bingo_gameId');
    sessionStorage.removeItem('bingo_playerId');
    sessionStorage.removeItem('bingo_playerName');
    sessionStorage.removeItem('bingo_cards');
    sessionStorage.removeItem('bingo_drawnNumbers');
    sessionStorage.removeItem('bingo_lineCalled');
    sessionStorage.removeItem('bingo_bingoCalled');
    sessionStorage.removeItem('bingo_status');
  }

  // -------------------------------------------------------------------------
  // Socket event subscriptions
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (!gameId) return;

    const cleanups: (() => void)[] = [];

    const cleanupNumberDrawn = onEvent('numberDrawn', ({ drawnNumbers }) => {
      setGameState((prev) =>
        prev ? { ...prev, drawnNumbers } : null
      );
    });
    cleanups.push(cleanupNumberDrawn);

    const cleanupNumberUnmarked = onEvent('numberUnmarked', ({ number, drawnNumbers }) => {
      setGameState((prev) =>
        prev ? { ...prev, drawnNumbers } : null
      );
      setUnmarkToast(number);
      const t = setTimeout(() => setUnmarkToast(null), 5000);
      cleanups.push(() => clearTimeout(t));
    });
    cleanups.push(cleanupNumberUnmarked);

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

    const cleanupGameEnded = onEvent('gameEnded', (payload: GameEndedPayload) => {
      setGameState((prev) =>
        prev ? { ...prev, status: 'ended' } : null
      );
      setGameEnd({ winner: payload.winner, reason: payload.reason });
      setCurrentAlert(null);
      setError('');
    });
    cleanups.push(cleanupGameEnded);

    const cleanupError = onEvent('error', (payload: ErrorPayload) => {
      setError(payload.message);
      // Auto-clear error after 8s
      const t = setTimeout(() => setError(''), 8000);
      cleanups.push(() => clearTimeout(t));
    });
    cleanups.push(cleanupError);

    const cleanupCardMarked = onEvent('cardMarked', ({ cardIndex, cellIndex }) => {
      setCards((prev) =>
        prev.map((card, i) => {
          if (i === cardIndex && !card.marked[cellIndex]) {
            const newMarked = [...card.marked];
            newMarked[cellIndex] = true;
            return { ...card, marked: newMarked };
          }
          return card;
        })
      );
    });
    cleanups.push(cleanupCardMarked);

    const cleanupCardUnmarked = onEvent('cardUnmarked', ({ cardIndex, cellIndex }) => {
      setCards((prev) =>
        prev.map((card, i) => {
          if (i === cardIndex && card.marked[cellIndex]) {
            const newMarked = [...card.marked];
            newMarked[cellIndex] = false;
            return { ...card, marked: newMarked };
          }
          return card;
        })
      );
    });
    cleanups.push(cleanupCardUnmarked);

    return () => {
      cleanups.forEach((c) => c());
    };
  }, [gameId, onEvent]);

  // -------------------------------------------------------------------------
  // Reconnection tracking (T6.4)
  // -------------------------------------------------------------------------
  useEffect(() => {
    // Detect reconnect: was disconnected, now connected
    if (connected && !lastConnectedRef.current) {
      setReconnectedToast(true);
      const t = setTimeout(() => setReconnectedToast(false), 3000);
      lastConnectedRef.current = true;
      return () => clearTimeout(t);
    }
    lastConnectedRef.current = connected;
  }, [connected]);

  // On reconnect, check if game ended while we were disconnected (T6.4 fallback)
  useEffect(() => {
    if (!connected || !gameId) return;

    const checkStatus = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
        const res = await fetch(`${apiUrl}/api/game/${gameId}`);
        if (res.ok) {
          const data: GameStateResponse = await res.json();
          if (data.status === 'ended') {
            setGameEnd({
              winner: 'Desconocido',
              reason: 'bingo',
            });
            setGameState((prev) =>
              prev ? { ...prev, status: 'ended' } : null
            );
          }
        }
      } catch {
        // Silent fail — server may be restarting
      }
    };

    checkStatus();
  }, [connected, gameId]);

  // -------------------------------------------------------------------------
  // Initialise game state / cards based on role
  // -------------------------------------------------------------------------
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
    } else if (role === 'player') {
      const storedDrawn: number[] = safeParse(
        sessionStorage.getItem('bingo_drawnNumbers'),
        []
      );
      const storedLineCalled = sessionStorage.getItem('bingo_lineCalled') === 'true';
      const storedBingoCalled = sessionStorage.getItem('bingo_bingoCalled') === 'true';
      const storedStatus: GameStatus =
        (sessionStorage.getItem('bingo_status') as GameStatus) || 'playing';
      const storedCards: Card[] = safeParse(
        sessionStorage.getItem('bingo_cards'),
        []
      );

      setGameState({
        id: gameId,
        status: storedStatus,
        players: [],
        dispensadorId: '',
        drawnNumbers: storedDrawn,
        lineCalled: storedLineCalled,
        bingoCalled: storedBingoCalled,
        createdAt: Date.now(),
      });
      setCards(storedCards);
    }
  }, [role, gameId]);

  // -------------------------------------------------------------------------
  // Alert detection (re-check after every cards / gameState change)
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (!gameState || cards.length === 0) return;

    const alert = detectAlert(
      cards,
      gameState.lineCalled,
      gameState.bingoCalled,
      lineAlertsSeen,
      bingoAlertsSeen
    );
    setCurrentAlert(alert);
  }, [cards, gameState?.lineCalled, gameState?.bingoCalled, lineAlertsSeen, bingoAlertsSeen]);

  // -------------------------------------------------------------------------
  // Handlers
  // -------------------------------------------------------------------------

  /** Dispensador: toggle a number in the 1-90 board. */
  const handleToggleNumber = (number: number) => {
    if (!gameId || gameState?.status === 'ended') return;
    if (gameState?.drawnNumbers.includes(number)) {
      emit('unmarkNumber', { gameId, number });
    } else {
      emit('drawNumber', { gameId, number });
    }
  };

  const handleToggleLine = () => {
    if (!gameId || gameState?.status === 'ended') return;
    emit('toggleLine', { gameId });
  };

  const handleToggleBingo = () => {
    if (!gameId || gameState?.status === 'ended') return;
    emit('toggleBingo', { gameId });
  };

  /** Player: toggle a cell on one of their cards (optimistic). */
  const handleMarkCard = useCallback(
    (cardIndex: number, cellIndex: number) => {
      if (!gameId || gameState?.status === 'ended') return;

      const card = cardsRef.current?.[cardIndex];
      if (!card) return;
      const isCurrentlyMarked = card.marked[cellIndex];

      // Optimistic local update
      setCards((prev) =>
        prev.map((c, i) => {
          if (i === cardIndex) {
            const newMarked = [...c.marked];
            newMarked[cellIndex] = !isCurrentlyMarked;
            return { ...c, marked: newMarked };
          }
          return c;
        })
      );

      if (isCurrentlyMarked) {
        emit('unmarkCard', { gameId, cardIndex, cellIndex });
      } else {
        emit('markCard', { gameId, cardIndex, cellIndex });
      }
    },
    [gameId, gameState?.status, emit]
  );

  const handleCallLine = () => {
    if (!gameId || !currentAlert) return;
    emit('callLine', { gameId });
    setLineAlertsSeen((prev) => [...prev, currentAlert.cardIndex]);
    setCurrentAlert(null);
  };

  const handleDismissLine = () => {
    if (!currentAlert) return;
    setLineAlertsSeen((prev) => [...prev, currentAlert.cardIndex]);
    setCurrentAlert(null);
  };

  const handleCallBingo = () => {
    if (!gameId || !currentAlert) return;
    emit('callBingo', { gameId });
    setBingoAlertsSeen((prev) => [...prev, currentAlert.cardIndex]);
    setCurrentAlert(null);
  };

  const handleDismissBingo = () => {
    if (!currentAlert) return;
    setBingoAlertsSeen((prev) => [...prev, currentAlert.cardIndex]);
    setCurrentAlert(null);
  };

  /** Game End: start a new game (create fresh, redirect). */
  const handleNewGame = () => {
    const playerName = sessionStorage.getItem('bingo_playerName') || 'Jugador';
    clearGameSession();

    // Listen for new game creation
    const cleanup = onEvent('gameCreated', ({ gameId: newId }) => {
      cleanup();
      sessionStorage.setItem('bingo_role', 'dispensador');
      sessionStorage.setItem('bingo_gameId', newId);
      sessionStorage.setItem('bingo_playerName', playerName);
      router.push(`/game/${newId}`);
    });

    emit('createGame', { playerName });
  };

  /** Game End: exit to landing, clear all state. */
  const handleExit = () => {
    clearGameSession();
    router.push('/');
  };

  // -------------------------------------------------------------------------
  // Render guards
  // -------------------------------------------------------------------------
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
            className="text-wood-dark hover:underline font-medium"
          >
            Volver al inicio
          </a>
        </div>
      </main>
    );
  }

  // -------------------------------------------------------------------------
  // Main layout
  // -------------------------------------------------------------------------
  return (
    <main className="min-h-screen bg-wood-light">
      <div className="max-w-3xl mx-auto px-3 py-4 sm:px-4 sm:py-6 space-y-4">
        {/* Header with connection + exit */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Bingo</h1>
            {/* Connection status */}
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                socketReconnecting
                  ? 'bg-yellow-100 text-yellow-800'
                  : connected
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  socketReconnecting
                    ? 'bg-yellow-500 animate-pulse'
                    : connected
                    ? 'bg-green-500'
                    : 'bg-red-500'
                }`}
              />
              {socketReconnecting
                ? 'Reconectando...'
                : connected
                ? 'Conectado'
                : 'Desconectado'}
            </span>
          </div>
          <button
            onClick={handleExit}
            className="px-3 py-1.5 text-xs sm:text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors font-medium"
          >
            Salir
          </button>
        </div>

        {/* Game ID for dispensador */}
        {role === 'dispensador' && <GameIdDisplay gameId={gameId} />}

        {/* Reconnected toast */}
        {reconnectedToast && (
          <div className="p-2.5 bg-green-50 text-green-700 rounded-lg text-sm text-center animate-alert-pop">
            ✅ Reconectado
          </div>
        )}

        {/* Connection lost banner */}
        {!connected && !socketReconnecting && (
          <div className="p-3 bg-yellow-50 text-yellow-800 rounded-lg text-sm text-center border border-yellow-200">
            ⚠️ Desconectado. Intentando reconectar...
          </div>
        )}

        {/* Error toast (auto-clears) */}
        {error && (
          <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm flex items-center justify-between">
            <span>{error}</span>
            <button
              onClick={() => setError('')}
              className="ml-2 text-red-400 hover:text-red-600 text-lg leading-none"
              aria-label="Cerrar"
            >
              ×
            </button>
          </div>
        )}

        {/* Unmark toast notification (auto-dismiss 5s) */}
        {unmarkToast !== null && (
          <div className="p-3 bg-green-50 text-green-800 rounded-lg text-sm flex items-center justify-between">
            <span>Número {unmarkToast} fue removido por el dispensador</span>
            <button
              onClick={() => setUnmarkToast(null)}
              className="ml-2 text-green-400 hover:text-green-600 text-lg leading-none"
              aria-label="Cerrar"
            >
              ×
            </button>
          </div>
        )}

        {/* Number display */}
        {gameState && (
          <div className="bg-wood-texture border border-wood-dark rounded-xl p-3 sm:p-4">
            <p className="text-xs text-wood-dark/70 mb-2 uppercase tracking-wide font-medium">
              Últimos números
            </p>
            <NumberDisplay drawnNumbers={gameState.drawnNumbers} />
          </div>
        )}

        {/* ── Dispensador view ──────────────────────────────────────── */}
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

        {/* ── Player view ───────────────────────────────────────────── */}
        {role === 'player' && gameState && (
          <>
            {cards.length === 0 ? (
              <div className="bg-wood-texture border border-wood-dark rounded-xl p-8 text-center">
                <p className="text-wood-dark mb-2">
                  No se encontraron cartones asignados.
                </p>
                <p className="text-sm text-wood-dark/70">
                  Asegurate de haber seleccionado la cantidad de cartones al
                  unirte.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {cards.map((card, index) => (
                  <div key={index} className="w-full">
                    <BingoCard
                      card={card}
                      cardIndex={index}
                      drawnNumbers={gameState.drawnNumbers}
                      onMark={handleMarkCard}
                      disabled={gameState.status === 'ended'}
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Line / Bingo alert modals */}
            {currentAlert?.type === 'line' && (
              <LineAlert
                cardIndex={currentAlert.cardIndex}
                onCall={handleCallLine}
                onCancel={handleDismissLine}
              />
            )}
            {currentAlert?.type === 'bingo' && (
              <BingoAlert
                cardIndex={currentAlert.cardIndex}
                onCall={handleCallBingo}
                onCancel={handleDismissBingo}
              />
            )}
          </>
        )}

        {/* ── Game End modal ────────────────────────────────────────── */}
        {gameEnd && (
          <GameEndModal
            winner={gameEnd.winner}
            reason={gameEnd.reason}
            onNewGame={handleNewGame}
            onExit={handleExit}
          />
        )}
      </div>
    </main>
  );
}

// ---------------------------------------------------------------------------
// JSON-safe parse helper
// ---------------------------------------------------------------------------
function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}
