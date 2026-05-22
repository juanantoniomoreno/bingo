import type { Card } from "./types";

/**
 * Client-side: check if a card has a complete line.
 * A row is complete if all non-null cells in that row are marked.
 */
export function hasLine(card: Card): boolean {
	for (let row = 0; row < 3; row++) {
		const cellsWithNumbers = Array.from(
			{ length: 9 },
			(_, col) => col * 3 + row,
		).filter((i) => card.numbers[i] > 0);
		if (
			cellsWithNumbers.length > 0 &&
			cellsWithNumbers.every((i) => card.marked[i])
		) {
			return true;
		}
	}
	return false;
}

/**
 * Client-side: check if a card has bingo.
 * Bingo = every non-null cell is marked.
 */
export function hasBingo(card: Card): boolean {
	return card.numbers.every((n, i) => n === 0 || card.marked[i]);
}

/**
 * Server-side: check if a card has a complete line given drawn numbers.
 * A row is complete if all non-null cells in that row have their numbers
 * contained in `drawnNumbers`.
 */
export function hasLineServer(
	card: Card,
	drawnNumbers: Set<number> | number[],
): boolean {
	const drawnSet =
		drawnNumbers instanceof Set ? drawnNumbers : new Set(drawnNumbers);
	for (let row = 0; row < 3; row++) {
		const cellsWithNumbers = Array.from(
			{ length: 9 },
			(_, col) => col * 3 + row,
		).filter((i) => card.numbers[i] > 0);
		if (
			cellsWithNumbers.length > 0 &&
			cellsWithNumbers.every((i) => drawnSet.has(card.numbers[i]))
		) {
			return true;
		}
	}
	return false;
}

/**
 * Server-side: check if a card has bingo given drawn numbers.
 * Bingo = every non-null cell's number is in `drawnNumbers`.
 */
export function hasBingoServer(
	card: Card,
	drawnNumbers: Set<number> | number[],
): boolean {
	const drawnSet =
		drawnNumbers instanceof Set ? drawnNumbers : new Set(drawnNumbers);
	return card.numbers.every((n) => n === 0 || drawnSet.has(n));
}
