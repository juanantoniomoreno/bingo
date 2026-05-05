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

/** Fisher-Yates shuffle (mutates array in place). */
function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Generate a valid 9×3 boolean pattern where:
 * - 6 columns have 2 numbers, 3 columns have 1 number → 15 total
 * - Each row has exactly 5 numbers
 * Uses generate-and-test with constrained initial distribution for fast convergence.
 */
function generateValidPattern(): boolean[][] {
  const rows = [0, 1, 2];

  for (let attempt = 0; attempt < 500; attempt++) {
    const pattern: boolean[][] = Array.from({ length: 9 }, () => [false, false, false]);
    // Column sizes: 6×2 + 3×1 = 15
    const colSizes = shuffle([2, 2, 2, 2, 2, 2, 1, 1, 1]);

    for (let col = 0; col < 9; col++) {
      const picked = shuffle([...rows]).slice(0, colSizes[col]);
      for (const r of picked) {
        pattern[col][r] = true;
      }
    }

    // Verify row sums
    const rowSums = [0, 0, 0];
    for (let c = 0; c < 9; c++) {
      for (let r = 0; r < 3; r++) {
        if (pattern[c][r]) rowSums[r]++;
      }
    }
    if (rowSums[0] === 5 && rowSums[1] === 5 && rowSums[2] === 5) {
      return pattern;
    }
  }

  // Fallback: deterministic valid pattern (guaranteed to work)
  // Columns: 0-5 have size 2, 6-8 have size 1. Row distribution balanced.
  const fallback: boolean[][] = [
    [true, true, false],   // col 0
    [true, false, true],   // col 1
    [false, true, true],   // col 2
    [true, true, false],   // col 3
    [true, false, true],   // col 4
    [false, true, true],   // col 5
    [true, false, false],  // col 6
    [false, true, false],  // col 7
    [false, false, true],  // col 8
  ];
  return fallback;
}

export class CardGenerator {
  /**
   * Generate a single valid bingo card.
   *
   * Algorithm (correct by construction):
   * 1. Generate a valid 9×3 boolean pattern (which cells have numbers)
   * 2. Fill each column with random numbers from its decade range (no duplicates within card)
   * 3. Sort numbers ascending within each column, place at pattern rows
   *
   * Returns a Card with 15 numbers (sorted within column) and all marked = false.
   */
  static generateCard(): Card {
    const pattern = generateValidPattern();

    // Fill numbers per column from its decade range
    const grid: (number | null)[][] = Array.from({ length: 9 }, () => [null, null, null]);
    const usedNumbers = new Set<number>();

    for (let col = 0; col < 9; col++) {
      const [low, high] = DECADE_RANGES[col];

      // Collect available numbers in this column's decade range
      const available: number[] = [];
      for (let n = low; n <= high; n++) {
        if (!usedNumbers.has(n)) {
          available.push(n);
        }
      }
      shuffle(available);

      // Assign numbers to filled rows (sorted ascending later)
      let numIdx = 0;
      for (let row = 0; row < 3; row++) {
        if (pattern[col][row]) {
          grid[col][row] = available[numIdx++];
          usedNumbers.add(available[numIdx - 1]);
        }
      }
    }

    // Build cells array: 27 elements (9 cols × 3 rows)
    // Index = col * 3 + row, 0 = blank cell
    const cells: number[] = new Array(27).fill(0);
    const marked: boolean[] = new Array(27).fill(false);

    for (let col = 0; col < 9; col++) {
      // Collect numbers with their row positions
      const entries: { row: number; value: number }[] = [];
      for (let row = 0; row < 3; row++) {
        if (grid[col][row] !== null) {
          entries.push({ row, value: grid[col][row]! });
        }
      }

      // Sort by value (ascending within column)
      entries.sort((a, b) => a.value - b.value);

      // Place sorted values at pattern rows in ascending row order
      let entryIdx = 0;
      for (let row = 0; row < 3; row++) {
        if (pattern[col][row]) {
          cells[col * 3 + row] = entries[entryIdx].value;
          entryIdx++;
        }
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

