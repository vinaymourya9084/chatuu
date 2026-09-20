import express from 'express';
import db from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Search users by username, display name, or email
router.get('/search', authenticateToken, (req, res) => {
  try {
    const { q } = req.query;
    const currentUserId = req.user.id;

    if (!q || !q.trim()) {
      // Return recent active users if query is empty
      const users = db.prepare(`
        SELECT id, username, display_name, avatar_url, bio, status_text, is_online, last_seen
        FROM users
        WHERE id != ?
        ORDER BY is_online DESC, last_seen DESC
        LIMIT 20
      `).all(currentUserId);
      return res.json({ users });
    }

    const searchTerm = `%${q.trim().toLowerCase()}%`;
    const users = db.prepare(`
      SELECT id, username, display_name, avatar_url, bio, status_text, is_online, last_seen
      FROM users
      WHERE id != ? AND (
        LOWER(username) LIKE ? OR
        LOWER(display_name) LIKE ? OR
        LOWER(email) LIKE ?
      )
      ORDER BY is_online DESC, display_name ASC
      LIMIT 30
    `).all(currentUserId, searchTerm, searchTerm, searchTerm);

    res.json({ users });
  } catch (err) {
    console.error('User search error:', err);
    res.status(500).json({ error: 'Failed to search users' });
  }
});

// Get user public profile by ID
router.get('/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const user = db.prepare(`
      SELECT id, username, display_name, avatar_url, bio, status_text, is_online, last_seen, created_at
      FROM users
      WHERE id = ?
    `).get(id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (err) {
    console.error('Get user error:', err);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Update user profile
router.put('/profile', authenticateToken, (req, res) => {
  try {
    const currentUserId = req.user.id;
    const { displayName, bio, statusText, avatarUrl } = req.body;

    const existing = db.prepare('SELECT * FROM users WHERE id = ?').get(currentUserId);
    if (!existing) {
      return res.status(404).json({ error: 'User not found' });
    }

    const newDisplayName = displayName !== undefined ? displayName.trim() || existing.display_name : existing.display_name;
    const newBio = bio !== undefined ? bio.trim() : existing.bio;
    const newStatusText = statusText !== undefined ? statusText.trim() : existing.status_text;
    const newAvatarUrl = avatarUrl !== undefined ? avatarUrl.trim() : existing.avatar_url;

    db.prepare(`
      UPDATE users
      SET display_name = ?, bio = ?, status_text = ?, avatar_url = ?
      WHERE id = ?
    `).run(newDisplayName, newBio, newStatusText, newAvatarUrl, currentUserId);

    const updatedUser = db.prepare(`
      SELECT id, username, email, display_name, avatar_url, bio, status_text, is_online, last_seen, created_at
      FROM users WHERE id = ?
    `).get(currentUserId);

    // Broadcast user profile update to all connected sockets
    const io = req.app.get('io');
    if (io) {
      io.emit('user_profile_updated', {
        user: updatedUser
      });
    }

    res.json({
      message: 'Profile updated successfully',
      user: updatedUser
    });
  } catch (err) {
    console.error('Profile update error:', err);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

export default router;
