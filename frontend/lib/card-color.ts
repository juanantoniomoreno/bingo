/**
 * Deterministic card number color assignment.
 *
 * Maps cardIndex % 5 → ball-red | ball-blue | ball-green | ball-yellow | ball-orange.
 * Pure deterministic — no Math.random(), no client-only state.
 * This guarantees SSR / hydration consistency (no flash / no mismatch).
 */
const CARD_COLORS = [
  'text-ball-red',
  'text-ball-blue',
  'text-ball-green',
  'text-ball-yellow',
  'text-ball-orange',
] as const;

/** Tailwind background classes with 30% opacity for marked-cell stamps. */
const CARD_BG_COLORS = [
  'bg-ball-red/30',
  'bg-ball-blue/30',
  'bg-ball-green/30',
  'bg-ball-yellow/30',
  'bg-ball-orange/30',
] as const;

export function getCardColorClass(cardIndex: number): string {
  return CARD_COLORS[cardIndex % 5];
}

export function getCardBgClass(cardIndex: number): string {
  return CARD_BG_COLORS[cardIndex % 5];
}
