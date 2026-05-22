import { customAlphabet } from "nanoid";
import type { Redis } from "ioredis";

// Generate only lowercase alphanumeric IDs (no underscores, no hyphens)
const generateGameId = customAlphabet(
	"abcdefghijklmnopqrstuvwxyz0123456789",
	6,
);
import { GameRoom } from "./GameRoom";
import { CardGenerator } from "./CardGenerator";
import type {
	GameState,
	Player,
	Card,
	CreateGameResponse,
	GameStateResponse,
	ErrorCode,
} from "shared";
import { ErrorCode as ErrorCodeEnum } from "shared";

/**
 * Maximum number of players per game
 */
const MAX_PLAYERS = 50;

/**
 * Redis key prefix for game state
 */
const REDIS_KEY_PREFIX = "bingo:game:";

/**
 * Redis TTL for game state (24 hours in seconds)
 */
const REDIS_TTL = 86400;

/**
 * GameManager — global registry mapping gameId → GameRoom.
 * Uses Redis as source of truth with an in-memory Map as hot cache.
 */
export class GameManager {
	private games: Map<string, GameRoom> = new Map();
	private redis: Redis | null = null;

	constructor(redis?: Redis) {
		if (redis) {
			this.redis = redis;
		}
	}

	/**
	 * Build the Redis key for a given gameId.
	 */
	private static redisKey(gameId: string): string {
		return `${REDIS_KEY_PREFIX}${gameId}`;
	}

	/**
	 * Persist a room to Redis (fire-and-forget with error logging).
	 */
	async saveGame(room: GameRoom): Promise<void> {
		if (!this.redis) return;
		try {
			const serialized = JSON.stringify(room.toJSON());
			await this.redis.setex(
				GameManager.redisKey(room.id),
				REDIS_TTL,
				serialized,
			);
		} catch (err) {
			console.error("❌ Failed to save game to Redis:", err);
		}
	}

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

		// Persist to Redis (async, non-blocking)
		this.saveGame(room).catch(() => {});

		return {
			gameId,
			playerId: player.id,
			playerName: player.name,
			isDispensador: true,
		};
	}

	/**
	 * Rejoin an existing game as a returning player.
	 * Looks up the player by ID and returns their existing state.
	 */
	rejoinGame(
		gameId: string,
		playerId: string,
	): { player: Player; game: GameRoom } | ErrorCode {
		const room = this.games.get(gameId);

		if (!room) {
			return ErrorCodeEnum.GAME_NOT_FOUND;
		}

		const player = room.getPlayer(playerId);
		if (!player) {
			return ErrorCodeEnum.GAME_NOT_FOUND;
		}

		return { player, game: room };
	}

	/**
	 * Join an existing game as a regular player.
	 */
	joinGame(
		gameId: string,
		playerName: string,
		cardCount: number,
	): { player: Player; game: GameRoom } | ErrorCode {
		const room = this.games.get(gameId);

		if (!room) {
			return ErrorCodeEnum.GAME_NOT_FOUND;
		}

		if (room.state === "ended") {
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

		// Persist updated room to Redis
		this.saveGame(room).catch(() => {});

		return { player, game: room };
	}

	/**
	 * Get a game room by ID.
	 * Checks memory first, then falls back to Redis.
	 */
	async getGame(gameId: string): Promise<GameRoom | undefined> {
		// Check memory cache first
		const cached = this.games.get(gameId);
		if (cached) {
			return cached;
		}

		// Fall back to Redis
		if (!this.redis) {
			return undefined;
		}

		try {
			const serialized = await this.redis.get(GameManager.redisKey(gameId));
			if (!serialized) {
				return undefined;
			}

			const data = JSON.parse(serialized);
			const room = GameRoom.fromJSON(data);
			this.games.set(gameId, room); // Warm cache
			return room;
		} catch (err) {
			console.error("❌ Failed to load game from Redis:", err);
			return undefined;
		}
	}

	/**
	 * Get the public game state for REST API polling.
	 */
	async getGameStateResponse(
		gameId: string,
	): Promise<GameStateResponse | ErrorCode> {
		const room = await this.getGame(gameId);

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
	 * Delete a game from both memory and Redis.
	 */
	async deleteGame(gameId: string): Promise<boolean> {
		const removed = this.games.delete(gameId);

		if (this.redis) {
			try {
				await this.redis.del(GameManager.redisKey(gameId));
			} catch (err) {
				console.error("❌ Failed to delete game from Redis:", err);
			}
		}

		return removed;
	}

	/**
	 * Get all active game IDs (useful for debugging).
	 */
	getActiveGameIds(): string[] {
		return Array.from(this.games.keys());
	}
}
