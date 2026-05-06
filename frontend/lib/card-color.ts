/**
 * Deterministic card color assignment.
 *
 * Maps cardIndex % 5 → vivid colors for borders, numbers, and backgrounds.
 * Pure deterministic — no Math.random(), no client-only state.
 * This guarantees SSR / hydration consistency (no flash / no mismatch).
 */

interface CardColorSet {
  name: string;
  text: string;
  border: string;
  markedBg: string;
  gridBg: string;
}

const CARD_COLOR_SETS: CardColorSet[] = [
  {
    name: 'red',
    text: '#dc2626',
    border: '#dc2626',
    markedBg: 'rgba(220, 38, 38, 0.3)',
    gridBg: 'rgba(220, 38, 38, 0.2)',
  },
  {
    name: 'blue',
    text: '#2563eb',
    border: '#2563eb',
    markedBg: 'rgba(37, 99, 235, 0.3)',
    gridBg: 'rgba(37, 99, 235, 0.2)',
  },
  {
    name: 'green',
    text: '#15803d',
    border: '#15803d',
    markedBg: 'rgba(21, 128, 61, 0.3)',
    gridBg: 'rgba(21, 128, 61, 0.2)',
  },
  {
    name: 'yellow',
    text: '#b45309',
    border: '#b45309',
    markedBg: 'rgba(180, 83, 9, 0.3)',
    gridBg: 'rgba(180, 83, 9, 0.2)',
  },
  {
    name: 'orange',
    text: '#c2410c',
    border: '#c2410c',
    markedBg: 'rgba(194, 65, 12, 0.3)',
    gridBg: 'rgba(194, 65, 12, 0.2)',
  },
];

export function getCardColors(cardIndex: number): CardColorSet {
  return CARD_COLOR_SETS[cardIndex % CARD_COLOR_SETS.length];
}