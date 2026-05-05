import type { Card } from 'shared';

/**
 * CardGenerator — implements the 9-column × 3-row bingo card algorithm.
 *
 * Rules:
 * - 9 columns, each covering a decade range (col 0: 1-9, col 1: 10-19, ..., col 8: 80-90)
 * - 3 rows, each with exactly 5 numbers (and 4 blanks)
 * - Each column has 1-3 numbers
 * - Numbers are sorted ascending within each column
 * - Total: 15 numbers per card
 */

// Decade ranges for each column
const DECADE_RANGES: [number, number][] = [
  [1, 9],   // column 0
  [10, 19],  // column 1
  [20, 29],  // column 2
  [30, 39],  // column 3
  [40, 49],  // column 4
  [50, 59],  // column 5
  [60, 69],  // column 6
  [70, 79],  // column 7
  [80, 90],  // column 8
];

export class CardGenerator {
  /**
   * Generate a single valid bingo card.
   * Returns a Card with 15 numbers (sorted within column) and 15 falses for marked.
   */
  static generateCard(): Card {
    // Grid: 9 columns × 3 rows, null means blank
    const grid: (number | null)[][] = [];
    for (let col = 0; col < 9; col++) {
      grid[col] = [null, null, null];
    }

    const numbersPerColumn: number[] = new Array(9).fill(0);
    const usedNumbers: Set<number> = new Set();

    // Fill rows one at a time, ensuring exactly 5 numbers per row
    for (let row = 0; row < 3; row++) {
      let numbersInRow = 0;
      let attempts = 0;

      while (numbersInRow < 5 && attempts < 200) {
        attempts++;

        // Find columns that can still accept numbers (max 3 per column)
        const eligibleColumns: number[] = [];
        for (let col = 0; col < 9; col++) {
          if (numbersPerColumn[col] < 3 && grid[col][row] === null) {
            eligibleColumns.push(col);
          }
        }

        if (eligibleColumns.length === 0) break;

        // Pick a random eligible column
        const col =
          eligibleColumns[Math.floor(Math.random() * eligibleColumns.length)];
        const [rangeStart, rangeEnd] = DECADE_RANGES[col];

        // Find available numbers in this column's range
        const availableNumbers: number[] = [];
        for (let n = rangeStart; n <= rangeEnd; n++) {
          if (!usedNumbers.has(n)) {
            availableNumbers.push(n);
          }
        }

        if (availableNumbers.length === 0) continue;

        // Pick a random available number
        const number =
          availableNumbers[Math.floor(Math.random() * availableNumbers.length)];
        grid[col][row] = number;
        usedNumbers.add(number);
        numbersPerColumn[col]++;
        numbersInRow++;
      }
    }

    // Validate: ensure we got exactly 15 numbers total
    const totalNumbers = numbersPerColumn.reduce((a, b) => a + b, 0);
    if (totalNumbers !== 15) {
      // Retry — rare edge case
      return CardGenerator.generateCard();
    }

    // Build position-based cells array: 27 elements (9 cols × 3 rows)
    // Index = col * 3 + row, 0 = blank cell
    // Numbers are sorted ascending within their column, placed at their row position
    const cells: number[] = new Array(27).fill(0);
    const marked: boolean[] = new Array(27).fill(false);

    for (let col = 0; col < 9; col++) {
      // Collect numbers in this column with their original row positions
      const columnEntries: { row: number; value: number }[] = [];
      for (let row = 0; row < 3; row++) {
        if (grid[col][row] !== null) {
          columnEntries.push({ row, value: grid[col][row]! });
        }
      }

      // Sort by value (ascending within column)
      columnEntries.sort((a, b) => a.value - b.value);

      // Place back at their row position
      for (const entry of columnEntries) {
        const idx = col * 3 + entry.row;
        cells[idx] = entry.value;
      }
    }

    return { numbers: cells, marked };
  }

  /**
   * Validate a card matches all the bingo card rules.
   */
  static validateCard(card: Card): boolean {
    if (card.numbers.length !== 27) return false;
    if (card.marked.length !== 27) return false;

    // Collect non-blank numbers
    const actualNumbers = card.numbers.filter((n) => n > 0);
    if (actualNumbers.length !== 15) return false;

    // Check all numbers are in valid range
    for (const n of actualNumbers) {
      if (n < 1 || n > 90) return false;
    }

    // Check no duplicates
    const uniqueNumbers = new Set(actualNumbers);
    if (uniqueNumbers.size !== 15) return false;

    // Check each number is in the correct decade column
    for (let idx = 0; idx < 27; idx++) {
      const n = card.numbers[idx];
      if (n === 0) continue;
      const col = Math.floor(idx / 3);
      const [rangeStart, rangeEnd] = DECADE_RANGES[col];
      if (n < rangeStart || n > rangeEnd) return false;
    }

    return true;
  }

  /**
   * Generate multiple cards (1-5).
   */
  static generateCards(count: number): Card[] {
    if (count < 1 || count > 5) {
      throw new Error('Card count must be between 1 and 5');
    }

    const cards: Card[] = [];
    for (let i = 0; i < count; i++) {
      cards.push(CardGenerator.generateCard());
    }
    return cards;
  }
}

