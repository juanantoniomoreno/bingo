/**
 * Deterministic card color assignment.
 *
 * Maps cardIndex % 5 → vivid colors for borders, numbers, and backgrounds.
 * Pure deterministic — no Math.random(), no client-only state.
 * This guarantees SSR / hydration consistency (no flash / no mismatch).
 */

const CARD_COLORS = [
  'ball-red',
  'ball-blue',
  'ball-green',
  'ball-yellow',
  'ball-orange',
] as const;

const CARD_TEXT_CLASSES = [
  'text-ball-red',
  'text-ball-blue',
  'text-ball-green',
  'text-ball-yellow',
  'text-ball-orange',
] as const;

const CARD_BORDER_CLASSES = [
  'border-ball-red',
  'border-ball-blue',
  'border-ball-green',
  'border-ball-yellow',
  'border-ball-orange',
] as const;

const CARD_BG_CLASSES = [
  'bg-ball-red/30',
  'bg-ball-blue/30',
  'bg-ball-green/30',
  'bg-ball-yellow/30',
  'bg-ball-orange/30',
] as const;

const CARD_GRID_BG_CLASSES = [
  'bg-ball-red/15',
  'bg-ball-blue/15',
  'bg-ball-green/15',
  'bg-ball-yellow/15',
  'bg-ball-orange/15',
] as const;

export function getCardColorKey(cardIndex: number): string {
  return CARD_COLORS[cardIndex % 5];
}

export function getCardColorClass(cardIndex: number): string {
  return CARD_TEXT_CLASSES[cardIndex % 5];
}

export function getCardBorderClass(cardIndex: number): string {
  return CARD_BORDER_CLASSES[cardIndex % 5];
}

export function getCardBgClass(cardIndex: number): string {
  return CARD_BG_CLASSES[cardIndex % 5];
}

export function getCardGridBgClass(cardIndex: number): string {
  return CARD_GRID_BG_CLASSES[cardIndex % 5];
}