'use client';

import { useState } from 'react';

interface GameIdDisplayProps {
  gameId: string;
  playerCount: number;
}

export function GameIdDisplay({ gameId, playerCount }: GameIdDisplayProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(gameId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="bg-metal-light border border-metal-mid rounded-lg shadow-md p-4 sm:p-6 text-center">
      <p className="text-sm text-metal-dark/70 mb-2">Código de Partida</p>
      <div className="flex items-center justify-center gap-3">
        <span className="text-2xl sm:text-3xl font-bold font-mono tracking-widest text-metal-dark">
          {gameId.toUpperCase()}
        </span>
        <button
          onClick={handleCopy}
          className="p-2 rounded-lg bg-metal-mid/20 hover:bg-metal-mid/40 text-metal-dark transition-colors focus-visible:ring-2 focus-visible:ring-metal-dark"
          title="Copiar código"
          aria-label="Copiar código de partida"
        >
          {copied ? (
            <svg
              className="w-5 h-5 text-green-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          ) : (
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
          )}
        </button>
      </div>
      {copied && (
        <p className="mt-2 text-sm text-green-600 font-medium animate-pulse">
          ¡Copiado!
        </p>
      )}
      <div className="mt-3 flex items-center justify-center gap-1.5 text-sm text-metal-dark/60">
        <svg
          className="w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
        <span className="font-medium tabular-nums">{playerCount}</span>
        <span>{playerCount === 1 ? 'conectado' : 'conectados'}</span>
      </div>
    </div>
  );
}
