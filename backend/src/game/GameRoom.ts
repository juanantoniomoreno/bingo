import { nanoid } from "nanoid";
import type { GameState, Player, Card, GameStatus } from "shared";

// Default TTL for games in Redis (24 hours in seconds)
const GAME_TTL = 86400;

export class GameRoom {
	public readonly id: string;
	public state: GameStatus;
	public dispensadorId: string | null;
	public drawnNumbers: Set<number>;
	public lineCalled: boolean;
	public bingoCalled: boolean;
	public createdAt: number;
	private players: Map<string, Player>;

	constructor(gameId: string) {
		this.id = gameId;
		this.state = "waiting";
		this.dispensadorId = null;
		this.drawnNumbers = new Set();
		this.lineCalled = false;
		this.bingoCalled = false;
		this.createdAt = Date.now();
		this.players = new Map();
	}

	/**
	 * Create a new player and add to this game
	 */
	addPlayer(
		name: string,
		cardCount: number,
		cards: Card[],
		isDispensador: boolean = false,
	): Player {
		const player: Player = {
			id: `player_${nanoid(10)}`,
			name,
			cards,
			isDispensador,
		};
		this.players.set(player.id, player);
		return player;
	}

	/**
	 * Get player by ID
	 */
	getPlayer(playerId: string): Player | undefined {
		return this.players.get(playerId);
	}

	/**
	 * Get all players as array
	 */
	getPlayers(): Player[] {
		return Array.from(this.players.values());
	}

	/**
	 * Get player count
	 */
	getPlayerCount(): number {
		return this.players.size;
	}

	/**
	 * Check if game is full (max 50 players)
	 */
	isFull(): boolean {
		return this.players.size >= 50;
	}

	/**
	 * Draw a number (add to drawn set)
	 */
	drawNumber(number: number): boolean {
		if (number < 1 || number > 90 || this.drawnNumbers.has(number)) {
			return false;
		}
		this.drawnNumbers.add(number);
		return true;
	}

	/**
	 * Unmark (remove) a previously drawn number from the drawn set.
	 * Returns true if the number was removed, false if not in set or out of range.
	 */
	unmarkNumber(number: number): boolean {
		if (number < 1 || number > 90) return false;
		return this.drawnNumbers.delete(number);
	}

	/**
	 * Check if a number has been drawn
	 */
	isNumberDrawn(number: number): boolean {
		return this.drawnNumbers.has(number);
	}

	/**
	 * Get all drawn numbers in insertion order
	 */
	getDrawnNumbers(): number[] {
		return Array.from(this.drawnNumbers);
	}

	/**
	 * Toggle line called state
	 */
	toggleLine(): boolean {
		this.lineCalled = !this.lineCalled;
		return this.lineCalled;
	}

	/**
	 * Toggle bingo called state (ends game)
	 */
	toggleBingo(): boolean {
		this.bingoCalled = !this.bingoCalled;
		if (this.bingoCalled) {
			this.state = "ended";
		}
		return this.bingoCalled;
	}

	/**
	 * Set game to playing state
	 */
	start(): void {
		if (this.state === "waiting") {
			this.state = "playing";
		}
	}

	/**
	 * End the game
	 */
	end(): void {
		this.state = "ended";
	}

	/**
	 * Get full game state for serialization
	 */
	toGameState(): GameState {
		return {
			id: this.id,
			status: this.state,
			players: this.getPlayers(),
			dispensadorId: this.dispensadorId,
			drawnNumbers: this.getDrawnNumbers(),
			lineCalled: this.lineCalled,
			bingoCalled: this.bingoCalled,
			createdAt: this.createdAt,
		};
	}

	/**
	 * Serialize game key prefix (for Redis)
	 */
	static getGameKey(gameId: string): string {
		return `game:${gameId}`;
	}

	/**
	 * Serialize players key
	 */
	static getPlayersKey(gameId: string): string {
		return `game:${gameId}:players`;
	}

	/**
	 * Serialize drawn numbers key
	 */
	static getDrawnKey(gameId: string): string {
		return `game:${gameId}:drawn`;
	}
}
