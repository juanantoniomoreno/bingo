'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { getSocket } from '@/lib/socket';
import type {
  ClientToServerEvents,
  ServerToClientEvents,
} from '@/types';

export function useSocket() {
  const socketRef = useRef(getSocket());
  const [connected, setConnected] = useState(socketRef.current.connected);

  useEffect(() => {
    const socket = socketRef.current;

    if (!socket.connected) {
      socket.connect();
    }

    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);

    if (socket.connected) {
      setConnected(true);
    }

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
    };
  }, []);

  const emit = useCallback(
    <E extends keyof ClientToServerEvents>(
      event: E,
      ...args: Parameters<ClientToServerEvents[E]>
    ) => {
      socketRef.current.emit(event, ...args);
    },
    []
  );

  const onEvent = useCallback(
    <E extends keyof ServerToClientEvents>(
      event: E,
      handler: ServerToClientEvents[E]
    ) => {
      (socketRef.current.on as any)(event, handler);
      return () => {
        (socketRef.current.off as any)(event, handler);
      };
    },
    []
  );

  return {
    socket: socketRef.current,
    connected,
    emit,
    onEvent,
  };
}

/**
 * Standalone hook for subscribing to a specific socket event.
 */
export function useSocketEvent<E extends keyof ServerToClientEvents>(
  event: E,
  handler: ServerToClientEvents[E]
) {
  const { onEvent } = useSocket();

  useEffect(() => {
    const cleanup = onEvent(event, handler);
    return cleanup;
  }, [event, handler, onEvent]);
}
