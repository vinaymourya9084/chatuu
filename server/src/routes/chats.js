import express from 'express';
import crypto from 'crypto';
import db from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get list of conversations for current user
router.get('/', authenticateToken, (req, res) => {
  try {
    const currentUserId = req.user.id;

    // Get all conversation IDs where current user is a member
    const userConvs = db.prepare(`
      SELECT cm.conversation_id, c.type, c.updated_at
      FROM conversation_members cm
      JOIN conversations c ON c.id = cm.conversation_id
      WHERE cm.user_id = ?
      ORDER BY c.updated_at DESC
    `).all(currentUserId);

    const conversations = userConvs.map(conv => {
      // Find the other participant for direct chat
      const otherMember = db.prepare(`
        SELECT u.id, u.username, u.display_name, u.avatar_url, u.bio, u.status_text, u.is_online, u.last_seen
        FROM conversation_members cm
        JOIN users u ON u.id = cm.user_id
        WHERE cm.conversation_id = ? AND cm.user_id != ?
      `).get(conv.conversation_id, currentUserId);

      // Get last message in this conversation
      const lastMessage = db.prepare(`
        SELECT id, sender_id, content, type, media_url, file_name, created_at, is_read
        FROM messages
        WHERE conversation_id = ?
        ORDER BY created_at DESC
        LIMIT 1
      `).get(conv.conversation_id);

      // Get unread count for current user
      const unreadRow = db.prepare(`
        SELECT COUNT(*) as count
        FROM messages
        WHERE conversation_id = ? AND sender_id != ? AND is_read = 0
      `).get(conv.conversation_id, currentUserId);

      return {
        id: conv.conversation_id,
        type: conv.type,
        updatedAt: conv.updated_at,
        participant: otherMember || null,
        lastMessage: lastMessage || null,
        unreadCount: unreadRow ? unreadRow.count : 0
      };
    });

    res.json({ conversations });
  } catch (err) {
    console.error('Fetch conversations error:', err);
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

// Start or get existing direct conversation with a target user
router.post('/direct', authenticateToken, (req, res) => {
  try {
    const currentUserId = req.user.id;
    const { targetUserId } = req.body;

    if (!targetUserId) {
      return res.status(400).json({ error: 'Target user ID is required' });
    }

    if (targetUserId === currentUserId) {
      return res.status(400).json({ error: 'Cannot start conversation with yourself' });
    }

    // Verify target user exists
    const targetUser = db.prepare(`
      SELECT id, username, display_name, avatar_url, bio, status_text, is_online, last_seen
      FROM users WHERE id = ?
    `).get(targetUserId);

    if (!targetUser) {
      return res.status(404).json({ error: 'Target user not found' });
    }

    // Check if direct conversation already exists between these 2 users
    const existingConv = db.prepare(`
      SELECT cm1.conversation_id
      FROM conversation_members cm1
      JOIN conversation_members cm2 ON cm1.conversation_id = cm2.conversation_id
      JOIN conversations c ON c.id = cm1.conversation_id
      WHERE c.type = 'direct' AND cm1.user_id = ? AND cm2.user_id = ?
    `).get(currentUserId, targetUserId);

    let conversationId;

    if (existingConv) {
      conversationId = existingConv.conversation_id;
    } else {
      // Create new conversation
      conversationId = crypto.randomUUID();
      const now = new Date().toISOString();

      db.prepare(`
        INSERT INTO conversations (id, type, created_at, updated_at)
        VALUES (?, 'direct', ?, ?)
      `).run(conversationId, now, now);

      const memberStmt = db.prepare(`
        INSERT INTO conversation_members (id, conversation_id, user_id, joined_at)
        VALUES (?, ?, ?, ?)
      `);

      memberStmt.run(crypto.randomUUID(), conversationId, currentUserId, now);
      memberStmt.run(crypto.randomUUID(), conversationId, targetUserId, now);
    }

    const lastMessage = db.prepare(`
      SELECT id, sender_id, content, type, media_url, file_name, created_at, is_read
      FROM messages
      WHERE conversation_id = ?
      ORDER BY created_at DESC
      LIMIT 1
    `).get(conversationId);

    res.json({
      conversation: {
        id: conversationId,
        type: 'direct',
        participant: targetUser,
        lastMessage: lastMessage || null,
        unreadCount: 0
      }
    });
  } catch (err) {
    console.error('Direct chat creation error:', err);
    res.status(500).json({ error: 'Failed to create or fetch direct conversation' });
  }
});

// Get messages for a conversation
router.get('/:conversationId/messages', authenticateToken, (req, res) => {
  try {
    const { conversationId } = req.params;
    const currentUserId = req.user.id;

    // Verify current user is a member of this conversation
    const isMember = db.prepare(`
      SELECT id FROM conversation_members
      WHERE conversation_id = ? AND user_id = ?
    `).get(conversationId, currentUserId);

    if (!isMember) {
      return res.status(403).json({ error: 'Not a member of this conversation' });
    }

    // Fetch messages
    const messages = db.prepare(`
      SELECT m.id, m.conversation_id, m.sender_id, m.content, m.type, m.media_url, m.file_name, m.file_size, m.created_at, m.is_read,
             u.username as sender_username, u.display_name as sender_name, u.avatar_url as sender_avatar
      FROM messages m
      JOIN users u ON u.id = m.sender_id
      WHERE m.conversation_id = ?
      ORDER BY m.created_at ASC
    `).all(conversationId);

    // Mark unread messages sent by others as read
    db.prepare(`
      UPDATE messages
      SET is_read = 1
      WHERE conversation_id = ? AND sender_id != ? AND is_read = 0
    `).run(conversationId, currentUserId);

    res.json({ messages });
  } catch (err) {
    console.error('Fetch messages error:', err);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Mark messages as read endpoint
router.post('/:conversationId/read', authenticateToken, (req, res) => {
  try {
    const { conversationId } = req.params;
    const currentUserId = req.user.id;

    db.prepare(`
      UPDATE messages
      SET is_read = 1
      WHERE conversation_id = ? AND sender_id != ? AND is_read = 0
    `).run(conversationId, currentUserId);

    res.json({ success: true });
  } catch (err) {
    console.error('Mark read error:', err);
    res.status(500).json({ error: 'Failed to mark messages as read' });
  }
});

export default router;
