import type { Socket } from 'socket.io';
import { GameManager } from './GameManager';
import { GameRoom } from './GameRoom';
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  CreateGamePayload,
  JoinGamePayload,
  DrawNumberPayload,
  UnmarkNumberPayload,
  ToggleLinePayload,
  ToggleBingoPayload,
  MarkCardPayload,
  UnmarkCardPayload,
  CallLinePayload,
  CallBingoPayload,
  ErrorPayload,
} from 'shared';
import { ErrorCode } from 'shared';

/**
 * Typed socket for our bingo game events.
 */
type BingoSocket = Socket<ClientToServerEvents, ServerToClientEvents>;

/**
 * Validate player name: 1-20 chars, alphanumeric + Spanish accents + ñ
 */
function isValidName(name: string): boolean {
  return /^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ ]{1,20}$/.test(name);
}

/**
 * Validate game ID: exactly 6 alphanumeric chars
 */
function isValidGameId(gameId: string): boolean {
  return /^[a-z0-9]{6}$/.test(gameId);
}

/**
 * Register all Socket.io event handlers.
 */
export function registerHandlers(
  io: import('socket.io').Server<ClientToServerEvents, ServerToClientEvents>,
  gameManager: GameManager
): void {
  io.on('connection', (socket: BingoSocket) => {
    console.log(`🔌 Client connected: ${socket.id}`);

    // ──────────────────────────────────────────────
    // createGame — Dispensador creates a new game
    // ──────────────────────────────────────────────
    socket.on('createGame', (payload: CreateGamePayload) => {
      if (!isValidName(payload.playerName)) {
        const error: ErrorPayload = {
          code: ErrorCode.INVALID_NAME,
          message: 'El nombre debe tener entre 1 y 20 caracteres (letras, números, espacios)',
        };
        socket.emit('error', error);
        return;
      }

      const result = gameManager.createGame(payload.playerName);

      // Join the socket room for this game
      socket.join(result.gameId);

      // Store gameId and playerId on the socket for later reference
      socket.data.gameId = result.gameId;
      socket.data.playerId = result.playerId;

      socket.emit('gameCreated', { gameId: result.gameId });

      console.log(
        `🎮 Game created: ${result.gameId} by ${result.playerName} (${result.playerId})`
      );
    });

    // ──────────────────────────────────────────────
    // joinGame — Player joins an existing game
    // ──────────────────────────────────────────────
    socket.on('joinGame', (payload: JoinGamePayload) => {
      if (!isValidGameId(payload.gameId)) {
        const error: ErrorPayload = {
          code: ErrorCode.GAME_NOT_FOUND,
          message: 'Partida no encontrada',
        };
        socket.emit('error', error);
        return;
      }

      if (!isValidName(payload.playerName)) {
        const error: ErrorPayload = {
          code: ErrorCode.INVALID_NAME,
          message: 'El nombre debe tener entre 1 y 20 caracteres',
        };
        socket.emit('error', error);
        return;
      }

      if (payload.cardCount < 1 || payload.cardCount > 5) {
        const error: ErrorPayload = {
          code: ErrorCode.INVALID_CARD_COUNT,
          message: 'Cantidad de cartones inválida (1-5)',
        };
        socket.emit('error', error);
        return;
      }

      const result = gameManager.joinGame(
        payload.gameId,
        payload.playerName,
        payload.cardCount
      );

      if (typeof result === 'string') {
        // It's an error code
        const error: ErrorPayload = {
          code: result,
          message: getErrorMessage(result),
        };
        socket.emit('error', error);
        return;
      }

      // Join the socket room
      socket.join(payload.gameId);

      // Store gameId and playerId on the socket
      socket.data.gameId = payload.gameId;
      socket.data.playerId = result.player.id;

      // Send game state to the joining player
      socket.emit('gameJoined', {
        game: result.game.toGameState(),
        playerId: result.player.id,
        cards: result.player.cards,
      });

      // Broadcast player count to everyone in the room
      io.to(payload.gameId).emit('playerJoined', {
        playerCount: result.game.getPlayerCount(),
      });

      console.log(
        `👤 Player ${result.player.name} (${result.player.id}) joined game ${payload.gameId}`
      );
    });

    // ──────────────────────────────────────────────
    // drawNumber — Dispensador draws a number (1-90)
    // ──────────────────────────────────────────────
    socket.on('drawNumber', (payload: DrawNumberPayload) => {
      const room = getGameForSocket(socket, gameManager);
      if (!room) return;

      // Verify dispensador
      if (socket.data.playerId !== room.dispensadorId) {
        socket.emit('error', {
          code: ErrorCode.NOT_DISPENSADOR,
          message: 'Solo el dispensador puede marcar números',
        });
        return;
      }

      // Validate number range
      if (payload.number < 1 || payload.number > 90) {
        socket.emit('error', {
          code: ErrorCode.NUMBER_ALREADY_DRAWN,
          message: 'Número inválido (debe ser entre 1 y 90)',
        });
        return;
      }

      // Check game hasn't ended
      if (room.state === 'ended') {
        socket.emit('error', {
          code: ErrorCode.GAME_ENDED,
          message: 'La partida ya terminó',
        });
        return;
      }

      // Try to draw
      const drawn = room.drawNumber(payload.number);
      if (!drawn) {
        socket.emit('error', {
          code: ErrorCode.NUMBER_ALREADY_DRAWN,
          message: 'Ese número ya fue marcado',
        });
        return;
      }

      // Broadcast to all players in the game
      io.to(payload.gameId).emit('numberDrawn', {
        number: payload.number,
        drawnNumbers: room.getDrawnNumbers(),
      });
    });

    // ──────────────────────────────────────────────
    // unmarkNumber — Dispensador unmarks a drawn number
    // ──────────────────────────────────────────────
    socket.on('unmarkNumber', (payload: UnmarkNumberPayload) => {
      const room = getGameForSocket(socket, gameManager);
      if (!room) return;

      // Verify dispensador
      if (socket.data.playerId !== room.dispensadorId) {
        socket.emit('error', {
          code: ErrorCode.NOT_DISPENSADOR,
          message: 'Solo el dispensador puede desmarcar números',
        });
        return;
      }

      // Validate number range
      if (payload.number < 1 || payload.number > 90) {
        socket.emit('error', {
          code: ErrorCode.NUMBER_NOT_DRAWN,
          message: 'Número inválido (debe ser entre 1 y 90)',
        });
        return;
      }

      // Check game hasn't ended
      if (room.state === 'ended') {
        socket.emit('error', {
          code: ErrorCode.GAME_ENDED,
          message: 'La partida ya terminó',
        });
        return;
      }

      // Try to unmark
      const unmarked = room.unmarkNumber(payload.number);
      if (!unmarked) {
        socket.emit('error', {
          code: ErrorCode.NUMBER_NOT_DRAWN,
          message: 'Ese número no fue marcado',
        });
        return;
      }

      // Broadcast to all players in the game
      io.to(payload.gameId).emit('numberUnmarked', {
        number: payload.number,
        drawnNumbers: room.getDrawnNumbers(),
      });
    });

    // ──────────────────────────────────────────────
    // toggleLine — Dispensador toggles line called state
    // ──────────────────────────────────────────────
    socket.on('toggleLine', (payload: ToggleLinePayload) => {
      const room = getGameForSocket(socket, gameManager);
      if (!room) return;

      if (socket.data.playerId !== room.dispensadorId) {
        socket.emit('error', {
          code: ErrorCode.NOT_DISPENSADOR,
          message: 'Solo el dispensador puede cantar línea',
        });
        return;
      }

      if (room.state === 'ended') {
        socket.emit('error', {
          code: ErrorCode.GAME_ENDED,
          message: 'La partida ya terminó',
        });
        return;
      }

      const lineCalled = room.toggleLine();

      io.to(payload.gameId).emit('lineToggled', { lineCalled });
    });

    // ──────────────────────────────────────────────
    // toggleBingo — Dispensador toggles bingo called state
    // ──────────────────────────────────────────────
    socket.on('toggleBingo', (payload: ToggleBingoPayload) => {
      const room = getGameForSocket(socket, gameManager);
      if (!room) return;

      if (socket.data.playerId !== room.dispensadorId) {
        socket.emit('error', {
          code: ErrorCode.NOT_DISPENSADOR,
          message: 'Solo el dispensador puede cantar bingo',
        });
        return;
      }

      if (room.state === 'ended') {
        socket.emit('error', {
          code: ErrorCode.GAME_ENDED,
          message: 'La partida ya terminó',
        });
        return;
      }

      const bingoCalled = room.toggleBingo();

      io.to(payload.gameId).emit('bingoToggled', { bingoCalled });

      // If bingo was called, end the game
      if (bingoCalled) {
        const dispensador = room.getPlayer(room.dispensadorId!);
        io.to(payload.gameId).emit('gameEnded', {
          winner: dispensador?.name || 'Dispensador',
          reason: 'bingo',
        });
      }
    });

    // ──────────────────────────────────────────────
    // markCard — Player marks a cell on their card (client-side only)
    // Server receives the event but only validates basics
    // ──────────────────────────────────────────────
    socket.on('markCard', (payload: MarkCardPayload) => {
      const room = getGameForSocket(socket, gameManager);
      if (!room) return;

      // Validate card/cell indices
      if (
        payload.cardIndex < 0 ||
        payload.cellIndex < 0 ||
        payload.cellIndex >= 27
      ) {
        socket.emit('error', {
          code: ErrorCode.GAME_NOT_FOUND, // Reusing error code for invalid input
          message: 'Índices de cartón inválidos',
        });
        return;
      }

      // Emit only to the player who marked (client-side state)
      socket.emit('cardMarked', {
        cardIndex: payload.cardIndex,
        cellIndex: payload.cellIndex,
      });
    });

    // ──────────────────────────────────────────────
    // unmarkCard — Player unmarks a cell on their card (client-side only)
    // Mirror of markCard: validate indices, echo to emitting socket
    // ──────────────────────────────────────────────
    socket.on('unmarkCard', (payload: UnmarkCardPayload) => {
      const room = getGameForSocket(socket, gameManager);
      if (!room) return;

      // Validate card/cell indices
      if (
        payload.cardIndex < 0 ||
        payload.cellIndex < 0 ||
        payload.cellIndex >= 27
      ) {
        socket.emit('error', {
          code: ErrorCode.GAME_NOT_FOUND,
          message: 'Índices de cartón inválidos',
        });
        return;
      }

      // Emit only to the player who unmarked (client-side state)
      socket.emit('cardUnmarked', {
        cardIndex: payload.cardIndex,
        cellIndex: payload.cellIndex,
      });
    });

    // ──────────────────────────────────────────────
    // callLine — Player calls line
    // ──────────────────────────────────────────────
    socket.on('callLine', (payload: CallLinePayload) => {
      const room = getGameForSocket(socket, gameManager);
      if (!room) return;

      if (room.state === 'ended') {
        socket.emit('error', {
          code: ErrorCode.GAME_ENDED,
          message: 'La partida ya terminó',
        });
        return;
      }

      // Player calls line — just broadcast it
      const player = room.getPlayer(socket.data.playerId);
      io.to(payload.gameId).emit('lineToggled', { lineCalled: true });

      console.log(
        `📝 Player ${player?.name} called LINE in game ${payload.gameId}`
      );
    });

    // ──────────────────────────────────────────────
    // callBingo — Player calls bingo (ends game)
    // ──────────────────────────────────────────────
    socket.on('callBingo', (payload: CallBingoPayload) => {
      const room = getGameForSocket(socket, gameManager);
      if (!room) return;

      if (room.state === 'ended') {
        socket.emit('error', {
          code: ErrorCode.GAME_ENDED,
          message: 'La partida ya terminó',
        });
        return;
      }

      const player = room.getPlayer(socket.data.playerId);
      room.bingoCalled = true;
      room.state = 'ended';

      io.to(payload.gameId).emit('bingoToggled', { bingoCalled: true });
      io.to(payload.gameId).emit('gameEnded', {
        winner: player?.name || 'Jugador',
        reason: 'bingo',
      });

      console.log(
        `🎉 Player ${player?.name} called BINGO in game ${payload.gameId}`
      );
    });

    // ──────────────────────────────────────────────
    // disconnect
    // ──────────────────────────────────────────────
    socket.on('disconnect', () => {
      console.log(`🔌 Client disconnected: ${socket.id}`);
    });
  });
}

/**
 * Helper: Get the GameRoom for a socket's gameId.
 * Emits an error if not found.
 */
function getGameForSocket(
  socket: BingoSocket,
  gameManager: GameManager
): GameRoom | null {
  const gameId = socket.data.gameId;
  if (!gameId) {
    socket.emit('error', {
      code: ErrorCode.GAME_NOT_FOUND,
      message: 'No estás en ninguna partida',
    });
    return null;
  }

  const room = gameManager.getGame(gameId);
  if (!room) {
    socket.emit('error', {
      code: ErrorCode.GAME_NOT_FOUND,
      message: 'Partida no encontrada',
    });
    return null;
  }

  return room;
}

/**
 * Helper: Get human-readable error message from error code.
 */
function getErrorMessage(code: string): string {
  const messages: Record<string, string> = {
    [ErrorCode.GAME_NOT_FOUND]: 'Partida no encontrada',
    [ErrorCode.GAME_FULL]: 'La partida está llena (máximo 50 jugadores)',
    [ErrorCode.NOT_DISPENSADOR]: 'Solo el dispensador puede realizar esta acción',
    [ErrorCode.NUMBER_ALREADY_DRAWN]: 'Número inválido o ya marcado',
    [ErrorCode.INVALID_NAME]: 'Nombre inválido',
    [ErrorCode.GAME_ENDED]: 'La partida ya terminó',
    [ErrorCode.INVALID_CARD_COUNT]: 'Cantidad de cartones inválida (1-5)',
  };
  return messages[code] || 'Error desconocido';
}