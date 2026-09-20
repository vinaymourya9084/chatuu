import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import db from './db.js';
import { JWT_SECRET } from './middleware/auth.js';

// Map of userId -> Set of active socket IDs
const onlineUsers = new Map();

export function setupSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: '*', // Allow all origins for local dev and LAN access
      methods: ['GET', 'POST']
    }
  });

  // Socket Auth Middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;

    if (!token) {
      return next(new Error('Authentication token required'));
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      const user = db.prepare(`
        SELECT id, username, display_name, avatar_url
        FROM users WHERE id = ?
      `).get(decoded.id);

      if (!user) {
        return next(new Error('User not found'));
      }

      socket.user = user;
      next();
    } catch (err) {
      return next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.user.id;
    console.log(`⚡ Socket connected: User ${socket.user.username} (${userId}) - Socket ${socket.id}`);

    // Track active connection
    if (!onlineUsers.has(userId)) {
      onlineUsers.set(userId, new Set());
    }
    onlineUsers.get(userId).add(socket.id);

    // Update user status to online in DB
    const now = new Date().toISOString();
    db.prepare('UPDATE users SET is_online = 1, last_seen = ? WHERE id = ?').run(now, userId);

    // Join personal user room
    socket.join(`user:${userId}`);

    // Broadcast user online to everyone
    io.emit('user_online', {
      userId,
      lastSeen: now
    });

    // Send the current list of online user IDs to the connected user
    socket.emit('active_users_list', Array.from(onlineUsers.keys()));

    // Join conversation room
    socket.on('join_conversation', (conversationId) => {
      if (conversationId) {
        socket.join(`conv:${conversationId}`);
      }
    });

    // Leave conversation room
    socket.on('leave_conversation', (conversationId) => {
      if (conversationId) {
        socket.leave(`conv:${conversationId}`);
      }
    });

    // Send a message
    socket.on('send_message', (data, ackCallback) => {
      try {
        const { conversationId, content, type = 'text', mediaUrl = '', fileName = '', fileSize = 0 } = data;

        if (!conversationId) {
          if (ackCallback) ackCallback({ error: 'Conversation ID required' });
          return;
        }

        if (type === 'text' && (!content || !content.trim())) {
          if (ackCallback) ackCallback({ error: 'Message content cannot be empty' });
          return;
        }

        // Verify sender is in conversation
        const isMember = db.prepare(`
          SELECT id FROM conversation_members WHERE conversation_id = ? AND user_id = ?
        `).get(conversationId, userId);

        if (!isMember) {
          if (ackCallback) ackCallback({ error: 'Unauthorized to send message in this chat' });
          return;
        }

        const messageId = crypto.randomUUID();
        const createdAt = new Date().toISOString();

        // Save message to SQLite
        db.prepare(`
          INSERT INTO messages (id, conversation_id, sender_id, content, type, media_url, file_name, file_size, created_at, is_read)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
        `).run(messageId, conversationId, userId, content || '', type, mediaUrl, fileName, fileSize, createdAt);

        // Update conversation updated_at
        db.prepare(`
          UPDATE conversations SET updated_at = ? WHERE id = ?
        `).run(createdAt, conversationId);

        // Fetch latest sender profile to ensure avatar is always up-to-date
        const sender = db.prepare(`
          SELECT username, display_name, avatar_url FROM users WHERE id = ?
        `).get(userId) || socket.user;

        const fullMessage = {
          id: messageId,
          conversation_id: conversationId,
          sender_id: userId,
          content: content || '',
          type,
          media_url: mediaUrl,
          file_name: fileName,
          file_size: fileSize,
          created_at: createdAt,
          is_read: 0,
          sender_username: sender.username,
          sender_name: sender.display_name,
          sender_avatar: sender.avatar_url
        };

        // Broadcast to conversation room
        io.to(`conv:${conversationId}`).emit('receive_message', fullMessage);

        // Also notify all members in their private user rooms (for unread count/sidebar update)
        const members = db.prepare(`
          SELECT user_id FROM conversation_members WHERE conversation_id = ?
        `).all(conversationId);

        members.forEach(m => {
          io.to(`user:${m.user_id}`).emit('conversation_updated', {
            conversationId,
            lastMessage: fullMessage,
            unreadSenderId: userId
          });
        });

        if (ackCallback) {
          ackCallback({ success: true, message: fullMessage });
        }
      } catch (err) {
        console.error('Socket send_message error:', err);
        if (ackCallback) ackCallback({ error: 'Failed to send message' });
      }
    });

    // Typing start
    socket.on('typing_start', ({ conversationId, recipientId }) => {
      const payload = {
        conversationId,
        userId,
        username: socket.user.username,
        displayName: socket.user.display_name
      };

      if (conversationId) {
        socket.to(`conv:${conversationId}`).emit('user_typing', payload);
      }
      if (recipientId) {
        socket.to(`user:${recipientId}`).emit('user_typing', payload);
      }
    });

    // Typing stop
    socket.on('typing_stop', ({ conversationId, recipientId }) => {
      const payload = { conversationId, userId };
      if (conversationId) {
        socket.to(`conv:${conversationId}`).emit('user_stop_typing', payload);
      }
      if (recipientId) {
        socket.to(`user:${recipientId}`).emit('user_stop_typing', payload);
      }
    });

    // Mark messages as read
    socket.on('mark_read', ({ conversationId }) => {
      try {
        if (!conversationId) return;

        db.prepare(`
          UPDATE messages
          SET is_read = 1
          WHERE conversation_id = ? AND sender_id != ? AND is_read = 0
        `).run(conversationId, userId);

        io.to(`conv:${conversationId}`).emit('messages_read', {
          conversationId,
          readerId: userId
        });
      } catch (err) {
        console.error('Socket mark_read error:', err);
      }
    });

    // Disconnect
    socket.on('disconnect', () => {
      const userSockets = onlineUsers.get(userId);
      if (userSockets) {
        userSockets.delete(socket.id);
        if (userSockets.size === 0) {
          onlineUsers.delete(userId);
          const lastSeenTime = new Date().toISOString();
          db.prepare('UPDATE users SET is_online = 0, last_seen = ? WHERE id = ?').run(lastSeenTime, userId);

          io.emit('user_offline', {
            userId,
            lastSeen: lastSeenTime
          });
        }
      }
      console.log(`🔌 Socket disconnected: User ${socket.user.username} (${userId})`);
    });
  });

  return io;
}
