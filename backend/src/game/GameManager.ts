import { customAlphabet } from 'nanoid';

// Generate only lowercase alphanumeric IDs (no underscores, no hyphens)
const generateGameId = customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', 6);
import { GameRoom } from './GameRoom';
import { CardGenerator } from './CardGenerator';
import type {
  GameState,
  Player,
  Card,
  CreateGameResponse,
  GameStateResponse,
  ErrorCode,
} from 'shared';
import { ErrorCode as ErrorCodeEnum } from 'shared';

/**
 * Maximum number of players per game
 */
const MAX_PLAYERS = 50;

/**
 * GameManager — global registry mapping gameId → GameRoom.
 * In-memory Map for fast lookups; Redis sync is a future enhancement.
 */
export class GameManager {
  private games: Map<string, GameRoom> = new Map();

  /**
   * Create a new game. The creator becomes the dispensador.
   */
  createGame(playerName: string): CreateGameResponse {
    const gameId = generateGameId();
    const room = new GameRoom(gameId);

    // Generate 1 card for dispensador (they can watch, but still get a card)
    const cards = CardGenerator.generateCards(1);
    const player = room.addPlayer(playerName, 1, cards, true);
    room.dispensadorId = player.id;
    room.start(); // Move to 'playing' state so dispensador can draw numbers

    this.games.set(gameId, room);

    return {
      gameId,
      playerId: player.id,
      playerName: player.name,
      isDispensador: true,
    };
  }

  /**
   * Join an existing game as a regular player.
   */
  joinGame(
    gameId: string,
    playerName: string,
    cardCount: number
  ): { player: Player; game: GameRoom } | ErrorCode {
    const room = this.games.get(gameId);

    if (!room) {
      return ErrorCodeEnum.GAME_NOT_FOUND;
    }

    if (room.state === 'ended') {
      return ErrorCodeEnum.GAME_ENDED;
    }

    if (room.isFull()) {
      return ErrorCodeEnum.GAME_FULL;
    }

    if (cardCount < 1 || cardCount > 5) {
      return ErrorCodeEnum.INVALID_CARD_COUNT;
    }

    const cards = CardGenerator.generateCards(cardCount);
    const player = room.addPlayer(playerName, cardCount, cards, false);

    return { player, game: room };
  }

  /**
   * Get a game room by ID. Returns undefined if not found.
   */
  getGame(gameId: string): GameRoom | undefined {
    return this.games.get(gameId);
  }

  /**
   * Get the public game state for REST API polling.
   */
  getGameStateResponse(gameId: string): GameStateResponse | ErrorCode {
    const room = this.games.get(gameId);

    if (!room) {
      return ErrorCodeEnum.GAME_NOT_FOUND;
    }

    return {
      id: room.id,
      status: room.state,
      playerCount: room.getPlayerCount(),
      drawnNumbers: room.getDrawnNumbers(),
      lineCalled: room.lineCalled,
      bingoCalled: room.bingoCalled,
      createdAt: room.createdAt,
    };
  }

  /**
   * Delete a game from the registry (for cleanup).
   */
  deleteGame(gameId: string): boolean {
    return this.games.delete(gameId);
  }

  /**
   * Get all active game IDs (useful for debugging).
   */
  getActiveGameIds(): string[] {
    return Array.from(this.games.keys());
  }
}