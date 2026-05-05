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
  const [reconnecting, setReconnecting] = useState(false);
  const wasConnectedRef = useRef(false);

  useEffect(() => {
    const socket = socketRef.current;

    if (!socket.connected) {
      socket.connect();
    }

    const onConnect = () => {
      const was = wasConnectedRef.current;
      wasConnectedRef.current = true;
      setConnected(true);
      setReconnecting(false);
      // Emit a custom event for the page to know about reconnect
      if (was) {
        socket.emit('_internal:reconnected');
      }
    };

    const onDisconnect = () => {
      setConnected(false);
    };

    const onReconnectAttempt = () => {
      setReconnecting(true);
    };

    const onReconnectFailed = () => {
      setReconnecting(false);
      setConnected(false);
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('reconnect_attempt', onReconnectAttempt);
    socket.on('reconnect_failed', onReconnectFailed);

    if (socket.connected) {
      wasConnectedRef.current = true;
      setConnected(true);
    }

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('reconnect_attempt', onReconnectAttempt);
      socket.off('reconnect_failed', onReconnectFailed);
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
    reconnecting,
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
