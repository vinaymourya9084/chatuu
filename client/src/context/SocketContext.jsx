import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { playMessageSound } from '../utils/sound';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { user, token } = useAuth();
  const [socket, setSocket] = useState(null);
  const [onlineUserIds, setOnlineUserIds] = useState(new Set());
  const [typingMap, setTypingMap] = useState({}); // { [convId]: { [userId]: { username, displayName, timeout } } }
  const typingTimeoutsRef = useRef({});

  useEffect(() => {
    if (!user || !token) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    // Connect to Socket.IO server
    const newSocket = io('/', {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000
    });

    newSocket.on('connect', () => {
      console.log('⚡ Connected to real-time chat socket');
    });

    // Receive initial active users list
    newSocket.on('active_users_list', (userIds) => {
      setOnlineUserIds(new Set(userIds));
    });

    // User came online
    newSocket.on('user_online', ({ userId }) => {
      setOnlineUserIds(prev => new Set([...prev, userId]));
    });

    // User went offline
    newSocket.on('user_offline', ({ userId }) => {
      setOnlineUserIds(prev => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    });

    // Typing start indicator
    newSocket.on('user_typing', ({ conversationId, userId, username, displayName }) => {
      if (userId === user.id) return;

      const key = `${conversationId}_${userId}`;
      if (typingTimeoutsRef.current[key]) {
        clearTimeout(typingTimeoutsRef.current[key]);
      }

      setTypingMap(prev => ({
        ...prev,
        [conversationId]: {
          ...(prev[conversationId] || {}),
          [userId]: { username, displayName }
        }
      }));

      // Auto clear typing state after 3.5 seconds if stop event was missed
      typingTimeoutsRef.current[key] = setTimeout(() => {
        setTypingMap(prev => {
          const convMap = { ...(prev[conversationId] || {}) };
          delete convMap[userId];
          return { ...prev, [conversationId]: convMap };
        });
      }, 3500);
    });

    // Typing stop indicator
    newSocket.on('user_stop_typing', ({ conversationId, userId }) => {
      const key = `${conversationId}_${userId}`;
      if (typingTimeoutsRef.current[key]) {
        clearTimeout(typingTimeoutsRef.current[key]);
      }

      setTypingMap(prev => {
        const convMap = { ...(prev[conversationId] || {}) };
        delete convMap[userId];
        return { ...prev, [conversationId]: convMap };
      });
    });

    // Play notification sound on incoming message
    newSocket.on('receive_message', (msg) => {
      if (msg.sender_id !== user.id) {
        playMessageSound();
      }
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [user?.id, token]);

  const isUserOnline = (targetUserId) => {
    return onlineUserIds.has(targetUserId);
  };

  const startTyping = (conversationId, recipientId) => {
    if (socket && conversationId) {
      socket.emit('typing_start', { conversationId, recipientId });
    }
  };

  const stopTyping = (conversationId, recipientId) => {
    if (socket && conversationId) {
      socket.emit('typing_stop', { conversationId, recipientId });
    }
  };

  const joinConversation = (conversationId) => {
    if (socket && conversationId) {
      socket.emit('join_conversation', conversationId);
    }
  };

  const leaveConversation = (conversationId) => {
    if (socket && conversationId) {
      socket.emit('leave_conversation', conversationId);
    }
  };

  const sendMessage = (data) => {
    return new Promise((resolve, reject) => {
      if (!socket) {
        return reject(new Error('Socket not connected'));
      }
      socket.emit('send_message', data, (response) => {
        if (response?.error) {
          reject(new Error(response.error));
        } else {
          resolve(response?.message);
        }
      });
    });
  };

  const markConversationAsRead = (conversationId) => {
    if (socket && conversationId) {
      socket.emit('mark_read', { conversationId });
    }
  };

  return (
    <SocketContext.Provider value={{
      socket,
      onlineUserIds,
      isUserOnline,
      typingMap,
      startTyping,
      stopTyping,
      joinConversation,
      leaveConversation,
      sendMessage,
      markConversationAsRead
    }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}
