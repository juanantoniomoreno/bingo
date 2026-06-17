// =============================================================================
// Bingo Multiplayer — Shared Types
// =============================================================================

// -----------------------------------------------------------------------------
// Core Domain Types
// -----------------------------------------------------------------------------

export type GameStatus = "waiting" | "playing" | "ended";

export interface GameState {
	id: string;
	status: GameStatus;
	players: Player[];
	dispensadorId: string | null;
	drawnNumbers: number[];
	lineCalled: boolean;
	bingoCalled: boolean;
	createdAt: number;
}

export interface Player {
	id: string;
	name: string;
	cards: Card[];
	isDispensador: boolean;
}

export interface Card {
	numbers: number[]; // 27 elements (9 cols × 3 rows), index = col*3 + row, 0 = blank cell
	marked: boolean[]; // 27 booleans, one per cell, true = marked/tachado
}

// -----------------------------------------------------------------------------
// Socket Events: Client → Server
// -----------------------------------------------------------------------------

export interface CreateGamePayload {
	playerName: string;
}

export interface JoinGamePayload {
	gameId: string;
	playerName: string;
	cardCount: number;
}

export interface DrawNumberPayload {
	gameId: string;
	number: number;
}

export interface ToggleLinePayload {
	gameId: string;
}

export interface ToggleBingoPayload {
	gameId: string;
	winnerName?: string;
}

export interface UnmarkNumberPayload {
	gameId: string;
	number: number;
}

export interface NumberUnmarkedPayload {
	number: number;
	drawnNumbers: number[];
}

export interface MarkCardPayload {
	gameId: string;
	cardIndex: number;
	cellIndex: number;
}

export interface UnmarkCardPayload {
	gameId: string;
	cardIndex: number;
	cellIndex: number;
}

export interface CallLinePayload {
	gameId: string;
}

export interface CallBingoPayload {
	gameId: string;
}

export interface RejoinGamePayload {
	gameId: string;
	playerId: string;
}

export interface LeaveGamePayload {
	gameId: string;
}

export interface ClientToServerEvents {
	createGame: (payload: CreateGamePayload) => void;
	joinGame: (payload: JoinGamePayload) => void;
	drawNumber: (payload: DrawNumberPayload) => void;
	unmarkNumber: (payload: UnmarkNumberPayload) => void;
	toggleLine: (payload: ToggleLinePayload) => void;
	toggleBingo: (payload: ToggleBingoPayload) => void;
	markCard: (payload: MarkCardPayload) => void;
	unmarkCard: (payload: UnmarkCardPayload) => void;
	callLine: (payload: CallLinePayload) => void;
	callBingo: (payload: CallBingoPayload) => void;
	rejoinGame: (payload: RejoinGamePayload) => void;
	leaveGame: (payload: LeaveGamePayload) => void;
}

// -----------------------------------------------------------------------------
// Socket Events: Server → Client
// -----------------------------------------------------------------------------

export interface GameCreatedPayload {
	gameId: string;
}

export interface GameJoinedPayload {
	game: GameState;
	playerId: string;
	cards: Card[];
}

export interface PlayerJoinedPayload {
	playerCount: number;
}

export interface PlayerLeftPayload {
	playerCount: number;
	playerName: string;
}

export interface NumberDrawnPayload {
	number: number;
	drawnNumbers: number[];
}

export interface LineToggledPayload {
	lineCalled: boolean;
}

export interface BingoToggledPayload {
	bingoCalled: boolean;
}

export interface CardMarkedPayload {
	cardIndex: number;
	cellIndex: number;
}

export interface CardUnmarkedPayload {
	cardIndex: number;
	cellIndex: number;
}

export interface GameEndedPayload {
	winner: string;
	reason: "line" | "bingo";
}

export interface ErrorPayload {
	code: string;
	message: string;
}

export interface GameRejoinedPayload {
	game: GameState;
	playerId: string;
	cards: Card[];
}

export interface ServerToClientEvents {
	gameCreated: (payload: GameCreatedPayload) => void;
	gameJoined: (payload: GameJoinedPayload) => void;
	gameRejoined: (payload: GameRejoinedPayload) => void;
	playerJoined: (payload: PlayerJoinedPayload) => void;
	playerLeft: (payload: PlayerLeftPayload) => void;
	numberDrawn: (payload: NumberDrawnPayload) => void;
	numberUnmarked: (payload: NumberUnmarkedPayload) => void;
	lineToggled: (payload: LineToggledPayload) => void;
	bingoToggled: (payload: BingoToggledPayload) => void;
	cardMarked: (payload: CardMarkedPayload) => void;
	cardUnmarked: (payload: CardUnmarkedPayload) => void;
	gameEnded: (payload: GameEndedPayload) => void;
	error: (payload: ErrorPayload) => void;
}

// -----------------------------------------------------------------------------
// REST API Types
// -----------------------------------------------------------------------------

export interface CreateGameRequest {
	playerName: string;
}

export interface CreateGameResponse {
	gameId: string;
	playerId: string;
	playerName: string;
	isDispensador: boolean;
}

export interface GameStateResponse {
	id: string;
	status: GameStatus;
	playerCount: number;
	drawnNumbers: number[];
	lineCalled: boolean;
	bingoCalled: boolean;
	createdAt: number;
}

// -----------------------------------------------------------------------------
// Error Codes
// -----------------------------------------------------------------------------

export enum ErrorCode {
	GAME_NOT_FOUND = "PARTIDA_NO_ENCONTRADA",
	GAME_FULL = "PARTIDA_LLENA",
	NOT_DISPENSADOR = "NO_ERES_DISPENSADOR",
	NUMBER_ALREADY_DRAWN = "NUMERO_INVALIDO",
	NUMBER_NOT_DRAWN = "NUMERO_NO_MARCADO",
	INVALID_NAME = "NOMBRE_INVALIDO",
	GAME_ENDED = "PARTIDA_TERMINADA",
	INVALID_CARD_COUNT = "CANTIDAD_INVALIDA",
	LINE_NOT_COMPLETE = "LINEA_INCOMPLETA",
	BINGO_NOT_COMPLETE = "BINGO_INCOMPLETO",
}
