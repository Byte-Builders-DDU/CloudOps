import { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';

export function useSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const [liveTick, setLiveTick] = useState(null);
  const [lastScaledResource, setLastScaledResource] = useState(null);
  const socketRef = useRef(null);

  useEffect(() => {
    // In Vite dev or prod, connect to current host
    const socket = io('/', {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('metrics:live_tick', (data) => {
      setLiveTick(data);
    });

    socket.on('resource:scaled', (data) => {
      setLastScaledResource(data);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const subscribeToResource = (resourceId) => {
    if (socketRef.current && resourceId) {
      socketRef.current.emit('subscribe:resource', resourceId);
    }
  };

  const unsubscribeFromResource = (resourceId) => {
    if (socketRef.current && resourceId) {
      socketRef.current.emit('unsubscribe:resource', resourceId);
    }
  };

  return {
    socket: socketRef.current,
    isConnected,
    liveTick,
    lastScaledResource,
    subscribeToResource,
    unsubscribeFromResource,
  };
}
