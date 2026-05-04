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

    // Flatten grid into numbers array (column-major order, nulls become 0)
    const numbers: number[] = [];
    for (let col = 0; col < 9; col++) {
      // Collect the numbers in this column, sort them ascending
      const colNumbers: number[] = [];
      for (let row = 0; row < 3; row++) {
        if (grid[col][row] !== null) {
          colNumbers.push(grid[col][row]!);
        }
      }
      colNumbers.sort((a, b) => a - b);

      // Place sorted numbers from top, fill rest with 0s
      let numIdx = 0;
      for (let row = 0; row < 3; row++) {
        if (grid[col][row] !== null) {
          // Push in column order: all col 0 rows, then col 1 rows, etc.
          // But we need to preserve position information for the UI
        }
      }
    }

    // Re-flatten properly: position-based array of 27 cells (9 cols × 3 rows)
    // Each cell is either a number or 0 (blank)
    // Index = col * 3 + row
    const cells: number[] = new Array(27).fill(0);

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

      // Place back, trying to preserve original row position
      // but ensuring ascending order within column
      for (const entry of columnEntries) {
        const idx = col * 3 + entry.row;
        cells[idx] = entry.value;
      }
    }

    // Now flatten to 15-number array (only non-zero cells), preserving column order
    const finalNumbers: number[] = [];
    const finalMarked: boolean[] = [];

    for (let col = 0; col < 9; col++) {
      let count = 0;
      for (let row = 0; row < 3; row++) {
        const idx = col * 3 + row;
        if (cells[idx] !== 0) {
          finalNumbers.push(cells[idx]);
          finalMarked.push(false);
          count++;
        }
      }
    }

    return {
      numbers: finalNumbers,
      marked: finalMarked,
    };
  }

  /**
   * Validate a card matches all the bingo card rules.
   */
  static validateCard(card: Card): boolean {
    if (card.numbers.length !== 15) return false;
    if (card.marked.length !== 15) return false;

    // Check all numbers are in valid range
    for (const n of card.numbers) {
      if (n < 1 || n > 90) return false;
    }

    // Check no duplicates
    const uniqueNumbers = new Set(card.numbers);
    if (uniqueNumbers.size !== 15) return false;

    // Check each number is in the correct decade column
    for (const n of card.numbers) {
      const col = n === 90 ? 8 : Math.floor(n / 10);
      // Verify the number belongs to its column's decade range
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

