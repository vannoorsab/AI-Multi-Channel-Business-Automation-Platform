'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { useWorkspace } from './WorkspaceContext';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const { activeWorkspace } = useWorkspace();
  const { token } = useAuth();

  useEffect(() => {
    if (!token) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setConnected(false);
      }
      return;
    }

    // Initialize Socket Client
    const socketUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    const socketClient = io(socketUrl, {
      transports: ['websocket'],
      autoConnect: true,
    });

    socketClient.on('connect', () => {
      setConnected(true);
      console.log('Socket.IO Client connected:', socketClient.id);
      
      // Auto-join active workspace room on connection
      if (activeWorkspace) {
        socketClient.emit('join_workspace', activeWorkspace._id);
      }
    });

    socketClient.on('disconnect', () => {
      setConnected(false);
      console.log('Socket.IO Client disconnected');
    });

    setSocket(socketClient);

    return () => {
      socketClient.disconnect();
    };
  }, [token]);

  // Handle active workspace shifts
  useEffect(() => {
    if (socket && connected && activeWorkspace) {
      // Leave previous rooms / join new room
      socket.emit('join_workspace', activeWorkspace._id);
    }
  }, [activeWorkspace, socket, connected]);

  return (
    <SocketContext.Provider value={{ socket, connected }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
