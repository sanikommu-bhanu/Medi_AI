const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../db/database');
const { authenticateToken } = require('../middleware/auth');
const { logActivity } = require('../middleware/logger');

const router = express.Router();

// Register
router.post('/register', async (req, res) => {
  const { email, password, full_name } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }
  
  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }

  const db = getDb();
  
  try {
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase());
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const userId = uuidv4();
    const profileId = uuidv4();
    const settingsId = uuidv4();

    const insertUser = db.prepare(`
      INSERT INTO users (id, email, password_hash) VALUES (?, ?, ?)
    `);
    
    const insertProfile = db.prepare(`
      INSERT INTO profiles (id, user_id, full_name) VALUES (?, ?, ?)
    `);
    
    const insertSettings = db.prepare(`
      INSERT INTO settings (id, user_id) VALUES (?, ?)
    `);

    db.transaction(() => {
      insertUser.run(userId, email.toLowerCase(), passwordHash);
      insertProfile.run(profileId, userId, full_name || '');
      insertSettings.run(settingsId, userId);
    })();

    const token = jwt.sign(
      { userId, sessionId: uuidv4() }, // We will use sessionId later if needed, but for now just generate token
      process.env.JWT_SECRET || 'carebot_secret',
      { expiresIn: '7d' }
    );
    
    const sessionId = uuidv4();
    const deviceInfo = req.get('User-Agent') || 'Unknown Device';
    const ipAddress = req.ip || req.connection.remoteAddress || 'Unknown IP';
    
    db.prepare(`
      INSERT INTO sessions (id, user_id, token, device_info, ip_address)
      VALUES (?, ?, ?, ?, ?)
    `).run(sessionId, userId, token, deviceInfo, ipAddress);

    db.prepare('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?').run(userId);
    logActivity('REGISTER', req, { id: userId });

    res.status(201).json({
      message: 'Account created successfully',
      token,
      user: { id: userId, email: email.toLowerCase(), full_name: full_name || '' }
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Failed to create account' });
  }
});

// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const db = getDb();
  
  try {
    const user = db.prepare('SELECT * FROM users WHERE email = ? AND is_active = 1').get(email.toLowerCase());
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET || 'carebot_secret',
      { expiresIn: '7d' }
    );
    
    const sessionId = uuidv4();
    const deviceInfo = req.get('User-Agent') || 'Unknown Device';
    const ipAddress = req.ip || req.connection.remoteAddress || 'Unknown IP';
    
    db.prepare(`
      INSERT INTO sessions (id, user_id, token, device_info, ip_address)
      VALUES (?, ?, ?, ?, ?)
    `).run(sessionId, user.id, token, deviceInfo, ipAddress);

    db.prepare('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?').run(user.id);
    logActivity('LOGIN', req, { id: user.id });

    const profile = db.prepare('SELECT * FROM profiles WHERE user_id = ?').get(user.id);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        full_name: profile?.full_name || '',
        onboarding_completed: profile?.onboarding_completed || 0
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Get current user
router.get('/me', authenticateToken, (req, res) => {
  const db = getDb();
  const profile = db.prepare('SELECT * FROM profiles WHERE user_id = ?').get(req.user.id);
  
  res.json({
    user: {
      ...req.user,
      profile
    }
  });
});

// Logout (client-side token removal, but we track it)
router.post('/logout', authenticateToken, (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (token) {
    const db = getDb();
    db.prepare('UPDATE sessions SET is_active = 0 WHERE token = ?').run(token);
  }
  
  logActivity('LOGOUT', req);
  res.json({ message: 'Logged out successfully' });
});

module.exports = router;
