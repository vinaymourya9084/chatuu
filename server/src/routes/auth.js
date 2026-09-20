import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import db from '../db.js';
import { JWT_SECRET, authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Generate a nice default avatar based on username / display name
const generateDefaultAvatar = (name) => {
  const cleanName = encodeURIComponent(name || 'User');
  return `https://api.dicebear.com/7.x/bottts/svg?seed=${cleanName}`;
};

// Register
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, displayName } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email, and password are required' });
    }

    const cleanUsername = username.trim().toLowerCase();
    const cleanEmail = email.trim().toLowerCase();

    if (cleanUsername.length < 3) {
      return res.status(400).json({ error: 'Username must be at least 3 characters' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Check if username or email already exists
    const existing = db.prepare('SELECT id, username, email FROM users WHERE username = ? OR email = ?').get(cleanUsername, cleanEmail);
    if (existing) {
      if (existing.username === cleanUsername) {
        return res.status(409).json({ error: 'Username already taken' });
      }
      return res.status(409).json({ error: 'Email already registered' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const userId = crypto.randomUUID();
    const finalDisplayName = displayName?.trim() || username.trim();
    const avatarUrl = generateDefaultAvatar(finalDisplayName);

    const stmt = db.prepare(`
      INSERT INTO users (id, username, email, password_hash, display_name, avatar_url, bio, status_text, is_online, last_seen)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP)
    `);

    stmt.run(
      userId,
      cleanUsername,
      cleanEmail,
      passwordHash,
      finalDisplayName,
      avatarUrl,
      'Hey there! I am using Chatuu.',
      'Available'
    );

    const user = db.prepare(`
      SELECT id, username, email, display_name, avatar_url, bio, status_text, is_online, last_seen, created_at
      FROM users WHERE id = ?
    `).get(userId);

    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '30d' });

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Server error during registration' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { identifier, password } = req.body; // identifier can be username or email

    if (!identifier || !password) {
      return res.status(400).json({ error: 'Username/email and password are required' });
    }

    const cleanIdentifier = identifier.trim().toLowerCase();

    const userRow = db.prepare(`
      SELECT id, username, email, password_hash, display_name, avatar_url, bio, status_text, is_online, last_seen, created_at
      FROM users WHERE LOWER(username) = ? OR LOWER(email) = ?
    `).get(cleanIdentifier, cleanIdentifier);

    if (!userRow) {
      return res.status(401).json({ error: 'Invalid credentials. User not found.' });
    }

    const isMatch = await bcrypt.compare(password, userRow.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials. Incorrect password.' });
    }

    // Exclude password_hash
    const { password_hash, ...user } = userRow;

    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '30d' });

    res.json({
      message: 'Login successful',
      token,
      user
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error during login' });
  }
});

// Get current logged-in user profile
router.get('/me', authenticateToken, (req, res) => {
  res.json({ user: req.user });
});

export default router;
