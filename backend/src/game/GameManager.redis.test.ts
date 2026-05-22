import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GameManager } from './GameManager';
import { GameRoom } from './GameRoom';
import type { Card } from 'shared';

// Simple in-memory Redis mock
function createMockRedis() {
  const store = new Map<string, string>();
  return {
    setex: vi.fn(async (key: string, ttl: number, value: string) => {
      store.set(key, value);
    }),
    get: vi.fn(async (key: string) => store.get(key) ?? null),
    del: vi.fn(async (key: string) => {
      store.delete(key);
      return 1;
    }),
    _store: store,
  };
}

describe('GameManager with Redis', () => {
  let mockRedis: ReturnType<typeof createMockRedis>;
  let gameManager: GameManager;

  beforeEach(() => {
    mockRedis = createMockRedis();
    gameManager = new GameManager(mockRedis as any);
  });

  it('createGame saves to Redis', async () => {
    gameManager.createGame('TestPlayer');

    // Wait a tick for the async saveGame
    await new Promise((r) => setTimeout(r, 10));

    const keys = Array.from(mockRedis._store.keys());
    expect(keys.length).toBe(1);
    expect(keys[0]).toMatch(/^bingo:game:/);

    const saved = JSON.parse(mockRedis._store.get(keys[0])!);
    expect(saved.players[0].name).toBe('TestPlayer');
    expect(saved.dispensadorId).toBe(saved.players[0].id);
  });

  it('getGame falls back to Redis when not in memory', async () => {
    // Create a room manually and save it to Redis
    const room = new GameRoom('abc123');
    room.state = 'playing';
    const cards: Card[] = [
      {
        numbers: new Array(27).fill(0),
        marked: new Array(27).fill(false),
      },
    ];
    room.addPlayer('Juan', 1, cards, false);
    room.drawNumber(42);

    // Store directly in mock Redis
    const serialized = JSON.stringify(room.toJSON());
    await mockRedis.setex('bingo:game:abc123', 86400, serialized);

    // Clear memory cache
    gameManager['games'].clear();

    const result = await gameManager.getGame('abc123');
    expect(result).toBeDefined();
    expect(result!.id).toBe('abc123');
    expect(result!.state).toBe('playing');
    expect(result!.getPlayerCount()).toBe(1);
    expect(result!.isNumberDrawn(42)).toBe(true);
  });

  it('deleteGame removes from Redis', async () => {
    gameManager.createGame('TestPlayer');
    await new Promise((r) => setTimeout(r, 10));

    const keys = Array.from(mockRedis._store.keys());
    const gameId = keys[0].replace('bingo:game:', '');

    await gameManager.deleteGame(gameId);

    expect(mockRedis._store.has(`bingo:game:${gameId}`)).toBe(false);
  });

  it('works without Redis (graceful degradation)', async () => {
    const managerNoRedis = new GameManager();
    const result = managerNoRedis.createGame('TestPlayer');

    // Should still work in memory
    const game = await managerNoRedis.getGame(result.gameId);
    expect(game).toBeDefined();
    expect(game!.id).toBe(result.gameId);
  });
});
