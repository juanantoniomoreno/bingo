import { describe, it, expect, beforeEach } from 'vitest';
import { GameRoom } from './GameRoom';
import type { Card } from 'shared';

// =============================================================================
// GameRoom.unmarkNumber
// =============================================================================

describe('GameRoom.unmarkNumber', () => {
  let room: GameRoom;

  beforeEach(() => {
    room = new GameRoom('test01');
    room.state = 'playing';
    // Pre-draw some numbers
    room.drawNumber(7);
    room.drawNumber(42);
    room.drawNumber(90);
  });

  // ── Happy path ────────────────────────────────────────────────────

  it('debe remover un número previamente marcado del Set y devolver true', () => {
    const result = room.unmarkNumber(42);

    expect(result).toBe(true);
    expect(room.isNumberDrawn(42)).toBe(false);
    expect(room.getDrawnNumbers()).not.toContain(42);
    // Other drawn numbers remain
    expect(room.isNumberDrawn(7)).toBe(true);
    expect(room.isNumberDrawn(90)).toBe(true);
  });

  it('debe devolver false cuando el número no está en drawnNumbers', () => {
    // 50 was never drawn
    const result = room.unmarkNumber(50);

    expect(result).toBe(false);
    // drawnNumbers unchanged
    expect(room.getDrawnNumbers()).toContain(7);
    expect(room.getDrawnNumbers()).toContain(42);
    expect(room.getDrawnNumbers()).toContain(90);
  });

  it('debe devolver false para número menor a 1', () => {
    const result = room.unmarkNumber(0);
    expect(result).toBe(false);
  });

  it('debe devolver false para número mayor a 90', () => {
    const result = room.unmarkNumber(91);
    expect(result).toBe(false);
  });

  // ── Edge cases ─────────────────────────────────────────────────────

  it('debe devolver false cuando drawnNumbers está vacío', () => {
    const emptyRoom = new GameRoom('empty');
    emptyRoom.state = 'playing';

    const result = emptyRoom.unmarkNumber(1);
    expect(result).toBe(false);
  });

  it('debe permitir volver a marcar un número después de desmarcarlo (drawNumber después de unmarkNumber)', () => {
    // Unmark 42
    room.unmarkNumber(42);
    expect(room.isNumberDrawn(42)).toBe(false);

    // Re-draw 42
    const redrawn = room.drawNumber(42);
    expect(redrawn).toBe(true);
    expect(room.isNumberDrawn(42)).toBe(true);
  });

  it('no debe modificar otros números al desmarcar uno', () => {
    const before = new Set(room.getDrawnNumbers());
    room.unmarkNumber(42);

    const after = new Set(room.getDrawnNumbers());
    // Before minus {42} should equal after
    const expected = new Set(before);
    expected.delete(42);

    expect(after).toEqual(expected);
  });
});

// =============================================================================
// GameRoom.toJSON / fromJSON
// =============================================================================

describe('GameRoom.toJSON / fromJSON', () => {
  it('roundtrip: serializes and deserializes an empty room', () => {
    const room = new GameRoom('abc123');
    room.state = 'waiting';
    room.dispensadorId = null;

    const json = room.toJSON();
    const restored = GameRoom.fromJSON(json);

    expect(restored.id).toBe('abc123');
    expect(restored.state).toBe('waiting');
    expect(restored.dispensadorId).toBeNull();
    expect(restored.drawnNumbers.size).toBe(0);
    expect(restored.lineCalled).toBe(false);
    expect(restored.bingoCalled).toBe(false);
    expect(restored.createdAt).toBe(room.createdAt);
    expect(restored.getPlayerCount()).toBe(0);
  });

  it('roundtrip: preserves drawnNumbers as a Set', () => {
    const room = new GameRoom('abc123');
    room.drawNumber(5);
    room.drawNumber(42);
    room.drawNumber(90);

    const json = room.toJSON();
    const restored = GameRoom.fromJSON(json);

    expect(restored.isNumberDrawn(5)).toBe(true);
    expect(restored.isNumberDrawn(42)).toBe(true);
    expect(restored.isNumberDrawn(90)).toBe(true);
    expect(restored.isNumberDrawn(1)).toBe(false);
    expect(restored.getDrawnNumbers()).toEqual(room.getDrawnNumbers());
  });

  it('roundtrip: preserves players and cards', () => {
    const room = new GameRoom('abc123');
    room.state = 'playing';

    const cards: Card[] = [
      {
        numbers: [
          1, 0, 0,
          10, 11, 0,
          20, 0, 21,
          30, 0, 0,
          40, 41, 0,
          50, 0, 0,
          60, 61, 0,
          70, 0, 0,
          80, 81, 82,
        ],
        marked: new Array(27).fill(false),
      },
    ];

    const player = room.addPlayer('Juan', 1, cards, false);
    room.dispensadorId = 'disp_001';

    const json = room.toJSON();
    const restored = GameRoom.fromJSON(json);

    expect(restored.getPlayerCount()).toBe(1);
    expect(restored.dispensadorId).toBe('disp_001');

    const restoredPlayer = restored.getPlayer(player.id);
    expect(restoredPlayer).toBeDefined();
    expect(restoredPlayer!.name).toBe('Juan');
    expect(restoredPlayer!.isDispensador).toBe(false);
    expect(restoredPlayer!.cards.length).toBe(1);
    expect(restoredPlayer!.cards[0].numbers).toEqual(cards[0].numbers);
    expect(restoredPlayer!.cards[0].marked).toEqual(cards[0].marked);
  });

  it('roundtrip: preserves lineCalled, bingoCalled, and createdAt', () => {
    const room = new GameRoom('abc123');
    room.toggleLine();
    room.toggleBingo();
    room.createdAt = 1234567890;

    const json = room.toJSON();
    const restored = GameRoom.fromJSON(json);

    expect(restored.lineCalled).toBe(true);
    expect(restored.bingoCalled).toBe(true);
    expect(restored.state).toBe('ended');
    expect(restored.createdAt).toBe(1234567890);
  });
});
