import { describe, it, expect } from "vitest";
import { hasLine, hasBingo, hasLineServer, hasBingoServer } from "shared";
import type { Card } from "shared";

// =============================================================================
// Helpers
// =============================================================================

function makeCard(numbers: number[]): Card {
	return {
		numbers,
		marked: new Array(27).fill(false),
	};
}

/** Mark specific cell indices */
function markCells(card: Card, indices: number[]): Card {
	const newMarked = [...card.marked];
	for (const i of indices) {
		newMarked[i] = true;
	}
	return { ...card, marked: newMarked };
}

// =============================================================================
// hasLine (client-side, checks marked[])
// =============================================================================

describe("hasLine", () => {
	it("returns false for an empty card", () => {
		const card = makeCard(new Array(27).fill(0));
		expect(hasLine(card)).toBe(false);
	});

	it("returns true when a complete row is marked", () => {
		const numbers = new Array(27).fill(0);
		numbers[0] = 1;
		numbers[3] = 10;
		numbers[6] = 20;
		numbers[9] = 30;
		numbers[12] = 40;

		let card = makeCard(numbers);
		card = markCells(card, [0, 3, 6, 9, 12]);

		expect(hasLine(card)).toBe(true);
	});

	it("returns false when a row has unmarked cells", () => {
		const numbers = new Array(27).fill(0);
		numbers[0] = 1;
		numbers[3] = 10;
		numbers[6] = 20;
		numbers[9] = 30;
		numbers[12] = 40;

		let card = makeCard(numbers);
		card = markCells(card, [0, 3, 6, 9]);

		expect(hasLine(card)).toBe(false);
	});
});

// =============================================================================
// hasBingo (client-side, checks marked[])
// =============================================================================

describe("hasBingo", () => {
	it("returns true for an empty card (vacuous)", () => {
		const card = makeCard(new Array(27).fill(0));
		expect(hasBingo(card)).toBe(true);
	});

	it("returns true when all non-null cells are marked", () => {
		const numbers = new Array(27).fill(0);
		numbers[0] = 1;
		numbers[3] = 10;
		numbers[6] = 20;

		let card = makeCard(numbers);
		card = markCells(card, [0, 3, 6]);

		expect(hasBingo(card)).toBe(true);
	});

	it("returns false when a non-null cell is unmarked", () => {
		const numbers = new Array(27).fill(0);
		numbers[0] = 1;
		numbers[3] = 10;
		numbers[6] = 20;

		let card = makeCard(numbers);
		card = markCells(card, [0, 3]);

		expect(hasBingo(card)).toBe(false);
	});
});

// =============================================================================
// hasLineServer (server-side, checks drawnNumbers)
// =============================================================================

describe("hasLineServer", () => {
	it("returns false when no numbers are drawn", () => {
		const numbers = new Array(27).fill(0);
		numbers[0] = 1;
		numbers[3] = 10;
		numbers[6] = 20;
		numbers[9] = 30;
		numbers[12] = 40;

		const card = makeCard(numbers);
		expect(hasLineServer(card, new Set())).toBe(false);
		expect(hasLineServer(card, [])).toBe(false);
	});

	it("returns true when a complete row is in drawnNumbers", () => {
		const numbers = new Array(27).fill(0);
		numbers[0] = 1;
		numbers[3] = 10;
		numbers[6] = 20;
		numbers[9] = 30;
		numbers[12] = 40;

		const card = makeCard(numbers);
		expect(hasLineServer(card, [1, 10, 20, 30, 40])).toBe(true);
		expect(hasLineServer(card, new Set([1, 10, 20, 30, 40]))).toBe(true);
	});

	it("returns false when drawnNumbers only partially covers a row", () => {
		const numbers = new Array(27).fill(0);
		numbers[0] = 1;
		numbers[3] = 10;
		numbers[6] = 20;
		numbers[9] = 30;
		numbers[12] = 40;

		const card = makeCard(numbers);
		expect(hasLineServer(card, [1, 10, 20, 30])).toBe(false);
	});

	it("returns true for any row, not just row 0", () => {
		const numbers = new Array(27).fill(0);
		numbers[1] = 2;
		numbers[4] = 11;
		numbers[7] = 21;
		numbers[10] = 31;
		numbers[13] = 41;

		const card = makeCard(numbers);
		expect(hasLineServer(card, [2, 11, 21, 31, 41])).toBe(true);
	});

	it("returns true when drawnNumbers contains extra numbers", () => {
		const numbers = new Array(27).fill(0);
		numbers[0] = 1;
		numbers[3] = 10;
		numbers[6] = 20;
		numbers[9] = 30;
		numbers[12] = 40;

		const card = makeCard(numbers);
		expect(hasLineServer(card, [1, 10, 20, 30, 40, 99, 100])).toBe(true);
	});
});

// =============================================================================
// hasBingoServer (server-side, checks drawnNumbers)
// =============================================================================

describe("hasBingoServer", () => {
	it("returns true for an empty card", () => {
		const card = makeCard(new Array(27).fill(0));
		expect(hasBingoServer(card, new Set())).toBe(true);
		expect(hasBingoServer(card, [])).toBe(true);
	});

	it("returns true when all non-null cells are in drawnNumbers", () => {
		const numbers = new Array(27).fill(0);
		numbers[0] = 1;
		numbers[3] = 10;
		numbers[6] = 20;

		const card = makeCard(numbers);
		expect(hasBingoServer(card, [1, 10, 20])).toBe(true);
		expect(hasBingoServer(card, new Set([1, 10, 20]))).toBe(true);
	});

	it("returns false when a non-null cell is not in drawnNumbers", () => {
		const numbers = new Array(27).fill(0);
		numbers[0] = 1;
		numbers[3] = 10;
		numbers[6] = 20;

		const card = makeCard(numbers);
		expect(hasBingoServer(card, [1, 10])).toBe(false);
	});

	it("returns true when drawnNumbers contains all numbers plus extras", () => {
		const numbers = new Array(27).fill(0);
		numbers[0] = 1;
		numbers[3] = 10;
		numbers[6] = 20;

		const card = makeCard(numbers);
		expect(hasBingoServer(card, [1, 10, 20, 30, 40])).toBe(true);
	});

	it("works with a realistic 15-number card", () => {
		const numbers = [
			1, 0, 0, 10, 11, 0, 20, 21, 0, 30, 0, 31, 40, 41, 0, 50, 0, 51, 60, 61, 0,
			70, 0, 71, 80, 81, 82,
		];

		const card = makeCard(numbers);
		const drawn = [
			1, 10, 11, 20, 21, 30, 31, 40, 41, 50, 51, 60, 61, 70, 71, 80, 81, 82,
		];
		expect(hasBingoServer(card, drawn)).toBe(true);

		const drawnMissing = [
			1, 10, 11, 20, 21, 30, 31, 40, 41, 50, 51, 60, 61, 70, 71, 80, 81,
		];
		expect(hasBingoServer(card, drawnMissing)).toBe(false);
	});
});
