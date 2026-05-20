import { describe, it, expect, vi, beforeEach } from 'vitest';
import { registerHandlers } from './handlers';
import { GameRoom } from './GameRoom';
import { ErrorCode } from 'shared';

// =============================================================================
// unmarkNumber handler
// =============================================================================

describe('unmarkNumber handler', () => {
  let mockIo: any;
  let roomEmit: ReturnType<typeof vi.fn>;
  let mockSocket: any;
  let mockGameManager: any;
  let room: GameRoom;
  let trigger: (event: string, payload: any) => void;

  beforeEach(() => {
    room = new GameRoom('test01');
    room.state = 'playing';
    room.dispensadorId = 'disp_001';
    room.drawNumber(42);
    room.drawNumber(7);

    const handlers = new Map<string, Function>();

    mockSocket = {
      on: vi.fn((event: string, cb: Function) => {
        handlers.set(event, cb);
        return mockSocket;
      }),
      emit: vi.fn(),
      join: vi.fn(),
      data: {
        gameId: 'test01',
        playerId: 'disp_001',
      },
    };

    trigger = (event: string, payload: any) => {
      const h = handlers.get(event);
      if (h) h(payload);
    };

    roomEmit = vi.fn();

    mockIo = {
      on: vi.fn((event: string, cb: Function) => {
        // Immediately invoke connection callback so handlers are registered
        if (event === 'connection') cb(mockSocket);
        return mockIo;
      }),
      to: vi.fn(() => ({ emit: roomEmit })),
    };

    mockGameManager = {
      getGame: vi.fn().mockReturnValue(room),
    };

    registerHandlers(mockIo as any, mockGameManager as any);
    // Handlers are now registered via the immediate connection callback
  });

  // ── Happy path ──────────────────────────────────────────────────────

  it('debe desmarcar un número marcado y emitir numberUnmarked a la sala', () => {
    trigger('unmarkNumber', { gameId: 'test01', number: 42 });

    // Should broadcast to the room
    expect(mockIo.to).toHaveBeenCalledWith('test01');
    expect(roomEmit).toHaveBeenCalledWith('numberUnmarked', {
      number: 42,
      drawnNumbers: [7],
    });

    // Should NOT emit an error
    expect(mockSocket.emit).not.toHaveBeenCalledWith('error', expect.anything());

    // Room state should reflect the removal
    expect(room.isNumberDrawn(42)).toBe(false);
    expect(room.getDrawnNumbers()).toEqual([7]);
  });

  // ── Validation: non-dispensador ─────────────────────────────────────

  it('debe rechazar desmarcado de no-dispensador con error NOT_DISPENSADOR', () => {
    mockSocket.data.playerId = 'player_999';

    trigger('unmarkNumber', { gameId: 'test01', number: 42 });

    expect(mockSocket.emit).toHaveBeenCalledWith('error', {
      code: ErrorCode.NOT_DISPENSADOR,
      message: 'Solo el dispensador puede desmarcar números',
    });

    // Should NOT broadcast
    expect(roomEmit).not.toHaveBeenCalled();

    // Room should remain unchanged
    expect(room.isNumberDrawn(42)).toBe(true);
  });

  // ── Validation: game ended ──────────────────────────────────────────

  it('debe rechazar desmarcado en partida terminada con error GAME_ENDED', () => {
    room.state = 'ended';

    trigger('unmarkNumber', { gameId: 'test01', number: 42 });

    expect(mockSocket.emit).toHaveBeenCalledWith('error', {
      code: ErrorCode.GAME_ENDED,
      message: 'La partida ya terminó',
    });

    expect(roomEmit).not.toHaveBeenCalled();
  });

  // ── Validation: number not drawn ────────────────────────────────────

  it('debe rechazar desmarcado de número no marcado con error NUMBER_NOT_DRAWN', () => {
    trigger('unmarkNumber', { gameId: 'test01', number: 50 });

    expect(mockSocket.emit).toHaveBeenCalledWith('error', {
      code: ErrorCode.NUMBER_NOT_DRAWN,
      message: 'Ese número no fue marcado',
    });

    expect(roomEmit).not.toHaveBeenCalled();
  });

  // ── Validation: number out of range ─────────────────────────────────

  it('debe rechazar número fuera de rango con error NUMBER_NOT_DRAWN', () => {
    trigger('unmarkNumber', { gameId: 'test01', number: 0 });
    expect(mockSocket.emit).toHaveBeenCalledWith('error', {
      code: ErrorCode.NUMBER_NOT_DRAWN,
      message: 'Número inválido (debe ser entre 1 y 90)',
    });
    expect(roomEmit).not.toHaveBeenCalled();

    // Reset calls for clean assertion on second trigger
    mockSocket.emit.mockClear();
    roomEmit.mockClear();

    trigger('unmarkNumber', { gameId: 'test01', number: 91 });
    expect(mockSocket.emit).toHaveBeenCalledWith('error', {
      code: ErrorCode.NUMBER_NOT_DRAWN,
      message: 'Número inválido (debe ser entre 1 y 90)',
    });
    expect(roomEmit).not.toHaveBeenCalled();
  });

  // ── Security: cross-game injection ──────────────────────────────────

  it('debe emitir numberUnmarked a la sala del socket (room.id), no al gameId del payload', () => {
    trigger('unmarkNumber', { gameId: 'evil02', number: 42 });

    // Should broadcast to the socket's actual room, NOT the payload gameId
    expect(mockIo.to).toHaveBeenCalledWith('test01');
    expect(mockIo.to).not.toHaveBeenCalledWith('evil02');
    expect(roomEmit).toHaveBeenCalledWith('numberUnmarked', {
      number: 42,
      drawnNumbers: [7],
    });
  });
});

// =============================================================================
// unmarkCard handler
// =============================================================================

describe('unmarkCard handler', () => {
  let mockIo: any;
  let roomEmit: ReturnType<typeof vi.fn>;
  let mockSocket: any;
  let mockGameManager: any;
  let room: GameRoom;
  let trigger: (event: string, payload: any) => void;

  beforeEach(() => {
    room = new GameRoom('test01');
    room.state = 'playing';
    room.dispensadorId = 'disp_001';

    const handlers = new Map<string, Function>();

    mockSocket = {
      on: vi.fn((event: string, cb: Function) => {
        handlers.set(event, cb);
        return mockSocket;
      }),
      emit: vi.fn(),
      join: vi.fn(),
      data: {
        gameId: 'test01',
        playerId: 'player_001',
      },
    };

    trigger = (event: string, payload: any) => {
      const h = handlers.get(event);
      if (h) h(payload);
    };

    roomEmit = vi.fn();

    mockIo = {
      on: vi.fn((event: string, cb: Function) => {
        if (event === 'connection') cb(mockSocket);
        return mockIo;
      }),
      to: vi.fn(() => ({ emit: roomEmit })),
    };

    mockGameManager = {
      getGame: vi.fn().mockReturnValue(room),
    };

    registerHandlers(mockIo as any, mockGameManager as any);
  });

  // ── Happy path: valid unmark echoes cardUnmarked to emitting socket ──

  it('debe emitir cardUnmarked al socket emisor cuando los índices son válidos', () => {
    trigger('unmarkCard', { gameId: 'test01', cardIndex: 0, cellIndex: 5 });

    // Should emit back to the SAME socket (not broadcast to room)
    expect(mockSocket.emit).toHaveBeenCalledWith('cardUnmarked', {
      cardIndex: 0,
      cellIndex: 5,
    });

    // Should NOT broadcast to the room
    expect(mockIo.to).not.toHaveBeenCalled();
    expect(roomEmit).not.toHaveBeenCalled();
  });

  // ── Triangulation: different valid indices ────────────────────────────

  it('debe emitir cardUnmarked con cardIndex y cellIndex diferentes', () => {
    trigger('unmarkCard', { gameId: 'test01', cardIndex: 2, cellIndex: 26 });

    expect(mockSocket.emit).toHaveBeenCalledWith('cardUnmarked', {
      cardIndex: 2,
      cellIndex: 26,
    });
  });

  // ── Validation: cellIndex out of bounds ────────────────────────────────

  it('debe rechazar cellIndex < 0 con error', () => {
    trigger('unmarkCard', { gameId: 'test01', cardIndex: 0, cellIndex: -1 });

    expect(mockSocket.emit).toHaveBeenCalledWith('error', {
      code: ErrorCode.GAME_NOT_FOUND,
      message: 'Índices de cartón inválidos',
    });
  });

  it('debe rechazar cellIndex >= 27 con error', () => {
    trigger('unmarkCard', { gameId: 'test01', cardIndex: 0, cellIndex: 27 });

    expect(mockSocket.emit).toHaveBeenCalledWith('error', {
      code: ErrorCode.GAME_NOT_FOUND,
      message: 'Índices de cartón inválidos',
    });
  });

  // ── Validation: cardIndex < 0 ─────────────────────────────────────────

  it('debe rechazar cardIndex < 0 con error', () => {
    trigger('unmarkCard', { gameId: 'test01', cardIndex: -1, cellIndex: 5 });

    expect(mockSocket.emit).toHaveBeenCalledWith('error', {
      code: ErrorCode.GAME_NOT_FOUND,
      message: 'Índices de cartón inválidos',
    });
  });
});

// =============================================================================
// drawNumber handler
// =============================================================================

describe('drawNumber handler', () => {
  let mockIo: any;
  let roomEmit: ReturnType<typeof vi.fn>;
  let mockSocket: any;
  let mockGameManager: any;
  let room: GameRoom;
  let trigger: (event: string, payload: any) => void;

  beforeEach(() => {
    room = new GameRoom('test01');
    room.state = 'playing';
    room.dispensadorId = 'disp_001';

    const handlers = new Map<string, Function>();

    mockSocket = {
      on: vi.fn((event: string, cb: Function) => {
        handlers.set(event, cb);
        return mockSocket;
      }),
      emit: vi.fn(),
      join: vi.fn(),
      data: {
        gameId: 'test01',
        playerId: 'disp_001',
      },
    };

    trigger = (event: string, payload: any) => {
      const h = handlers.get(event);
      if (h) h(payload);
    };

    roomEmit = vi.fn();

    mockIo = {
      on: vi.fn((event: string, cb: Function) => {
        if (event === 'connection') cb(mockSocket);
        return mockIo;
      }),
      to: vi.fn(() => ({ emit: roomEmit })),
    };

    mockGameManager = {
      getGame: vi.fn().mockReturnValue(room),
    };

    registerHandlers(mockIo as any, mockGameManager as any);
  });

  it('debe emitir numberDrawn a la sala del socket, no al gameId del payload', () => {
    trigger('drawNumber', { gameId: 'evil02', number: 42 });

    expect(mockIo.to).toHaveBeenCalledWith('test01');
    expect(mockIo.to).not.toHaveBeenCalledWith('evil02');
    expect(roomEmit).toHaveBeenCalledWith('numberDrawn', {
      number: 42,
      drawnNumbers: [42],
    });
  });
});

// =============================================================================
// toggleLine handler
// =============================================================================

describe('toggleLine handler', () => {
  let mockIo: any;
  let roomEmit: ReturnType<typeof vi.fn>;
  let mockSocket: any;
  let mockGameManager: any;
  let room: GameRoom;
  let trigger: (event: string, payload: any) => void;

  beforeEach(() => {
    room = new GameRoom('test01');
    room.state = 'playing';
    room.dispensadorId = 'disp_001';

    const handlers = new Map<string, Function>();

    mockSocket = {
      on: vi.fn((event: string, cb: Function) => {
        handlers.set(event, cb);
        return mockSocket;
      }),
      emit: vi.fn(),
      join: vi.fn(),
      data: {
        gameId: 'test01',
        playerId: 'disp_001',
      },
    };

    trigger = (event: string, payload: any) => {
      const h = handlers.get(event);
      if (h) h(payload);
    };

    roomEmit = vi.fn();

    mockIo = {
      on: vi.fn((event: string, cb: Function) => {
        if (event === 'connection') cb(mockSocket);
        return mockIo;
      }),
      to: vi.fn(() => ({ emit: roomEmit })),
    };

    mockGameManager = {
      getGame: vi.fn().mockReturnValue(room),
    };

    registerHandlers(mockIo as any, mockGameManager as any);
  });

  it('debe emitir lineToggled a la sala del socket, no al gameId del payload', () => {
    trigger('toggleLine', { gameId: 'evil02' });

    expect(mockIo.to).toHaveBeenCalledWith('test01');
    expect(mockIo.to).not.toHaveBeenCalledWith('evil02');
    expect(roomEmit).toHaveBeenCalledWith('lineToggled', { lineCalled: true });
  });
});

// =============================================================================
// toggleBingo handler
// =============================================================================

describe('toggleBingo handler', () => {
  let mockIo: any;
  let roomEmit: ReturnType<typeof vi.fn>;
  let mockSocket: any;
  let mockGameManager: any;
  let room: GameRoom;
  let trigger: (event: string, payload: any) => void;

  beforeEach(() => {
    room = new GameRoom('test01');
    room.state = 'playing';
    room.dispensadorId = 'disp_001';

    const handlers = new Map<string, Function>();

    mockSocket = {
      on: vi.fn((event: string, cb: Function) => {
        handlers.set(event, cb);
        return mockSocket;
      }),
      emit: vi.fn(),
      join: vi.fn(),
      data: {
        gameId: 'test01',
        playerId: 'disp_001',
      },
    };

    trigger = (event: string, payload: any) => {
      const h = handlers.get(event);
      if (h) h(payload);
    };

    roomEmit = vi.fn();

    mockIo = {
      on: vi.fn((event: string, cb: Function) => {
        if (event === 'connection') cb(mockSocket);
        return mockIo;
      }),
      to: vi.fn(() => ({ emit: roomEmit })),
    };

    mockGameManager = {
      getGame: vi.fn().mockReturnValue(room),
    };

    registerHandlers(mockIo as any, mockGameManager as any);
  });

  it('debe emitir bingoToggled y gameEnded a la sala del socket, no al gameId del payload', () => {
    trigger('toggleBingo', { gameId: 'evil02' });

    expect(mockIo.to).toHaveBeenCalledWith('test01');
    expect(mockIo.to).not.toHaveBeenCalledWith('evil02');
    expect(roomEmit).toHaveBeenCalledWith('bingoToggled', { bingoCalled: true });
    expect(roomEmit).toHaveBeenCalledWith('gameEnded', {
      winner: 'Dispensador',
      reason: 'bingo',
    });
  });
});

// =============================================================================
// callLine handler
// =============================================================================

describe('callLine handler', () => {
  let mockIo: any;
  let roomEmit: ReturnType<typeof vi.fn>;
  let mockSocket: any;
  let mockGameManager: any;
  let room: GameRoom;
  let trigger: (event: string, payload: any) => void;

  beforeEach(() => {
    room = new GameRoom('test01');
    room.state = 'playing';
    room.dispensadorId = 'disp_001';

    const handlers = new Map<string, Function>();

    mockSocket = {
      on: vi.fn((event: string, cb: Function) => {
        handlers.set(event, cb);
        return mockSocket;
      }),
      emit: vi.fn(),
      join: vi.fn(),
      data: {
        gameId: 'test01',
        playerId: 'player_001',
      },
    };

    trigger = (event: string, payload: any) => {
      const h = handlers.get(event);
      if (h) h(payload);
    };

    roomEmit = vi.fn();

    mockIo = {
      on: vi.fn((event: string, cb: Function) => {
        if (event === 'connection') cb(mockSocket);
        return mockIo;
      }),
      to: vi.fn(() => ({ emit: roomEmit })),
    };

    mockGameManager = {
      getGame: vi.fn().mockReturnValue(room),
    };

    registerHandlers(mockIo as any, mockGameManager as any);
  });

  it('debe emitir lineToggled a la sala del socket, no al gameId del payload', () => {
    trigger('callLine', { gameId: 'evil02' });

    expect(mockIo.to).toHaveBeenCalledWith('test01');
    expect(mockIo.to).not.toHaveBeenCalledWith('evil02');
    expect(roomEmit).toHaveBeenCalledWith('lineToggled', { lineCalled: true });
  });
});

// =============================================================================
// callBingo handler
// =============================================================================

describe('callBingo handler', () => {
  let mockIo: any;
  let roomEmit: ReturnType<typeof vi.fn>;
  let mockSocket: any;
  let mockGameManager: any;
  let room: GameRoom;
  let trigger: (event: string, payload: any) => void;

  beforeEach(() => {
    room = new GameRoom('test01');
    room.state = 'playing';
    room.dispensadorId = 'disp_001';

    const handlers = new Map<string, Function>();

    mockSocket = {
      on: vi.fn((event: string, cb: Function) => {
        handlers.set(event, cb);
        return mockSocket;
      }),
      emit: vi.fn(),
      join: vi.fn(),
      data: {
        gameId: 'test01',
        playerId: 'player_001',
      },
    };

    trigger = (event: string, payload: any) => {
      const h = handlers.get(event);
      if (h) h(payload);
    };

    roomEmit = vi.fn();

    mockIo = {
      on: vi.fn((event: string, cb: Function) => {
        if (event === 'connection') cb(mockSocket);
        return mockIo;
      }),
      to: vi.fn(() => ({ emit: roomEmit })),
    };

    mockGameManager = {
      getGame: vi.fn().mockReturnValue(room),
    };

    registerHandlers(mockIo as any, mockGameManager as any);
  });

  it('debe emitir bingoToggled y gameEnded a la sala del socket, no al gameId del payload', () => {
    trigger('callBingo', { gameId: 'evil02' });

    expect(mockIo.to).toHaveBeenCalledWith('test01');
    expect(mockIo.to).not.toHaveBeenCalledWith('evil02');
    expect(roomEmit).toHaveBeenCalledWith('bingoToggled', { bingoCalled: true });
    expect(roomEmit).toHaveBeenCalledWith('gameEnded', {
      winner: 'Jugador',
      reason: 'bingo',
    });
  });
});
