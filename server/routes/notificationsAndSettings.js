const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../db/database');
const { authenticateToken } = require('../middleware/auth');

const notifRouter = express.Router();
const settingsRouter = express.Router();

// NOTIFICATIONS

// Get notifications
notifRouter.get('/', authenticateToken, (req, res) => {
  const db = getDb();
  const { unread } = req.query;
  
  let query = 'SELECT * FROM notifications WHERE user_id = ?';
  if (unread === 'true') query += ' AND is_read = 0';
  query += ' ORDER BY created_at DESC LIMIT 50';
  
  const notifications = db.prepare(query).all(req.user.id);
  const unreadCount = db.prepare('SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0').get(req.user.id)?.count || 0;
  
  res.json({ notifications, unreadCount });
});

// Mark as read
notifRouter.put('/:id/read', authenticateToken, (req, res) => {
  const db = getDb();
  db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
  res.json({ message: 'Notification marked as read' });
});

// Mark all as read
notifRouter.put('/read-all', authenticateToken, (req, res) => {
  const db = getDb();
  db.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ?').run(req.user.id);
  res.json({ message: 'All notifications marked as read' });
});

// Delete notification
notifRouter.delete('/:id', authenticateToken, (req, res) => {
  const db = getDb();
  db.prepare('DELETE FROM notifications WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
  res.json({ message: 'Notification deleted' });
});

// Create system notification (for testing)
notifRouter.post('/', authenticateToken, (req, res) => {
  const db = getDb();
  const { title, body, type } = req.body;
  const id = uuidv4();
  
  db.prepare('INSERT INTO notifications (id, user_id, title, body, type) VALUES (?, ?, ?, ?, ?)').run(
    id, req.user.id, title, body, type || 'info'
  );
  
  const notification = db.prepare('SELECT * FROM notifications WHERE id = ?').get(id);
  res.status(201).json({ notification });
});

// Get VAPID public key
notifRouter.get('/vapid-key', authenticateToken, (req, res) => {
  const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBtc3sOE_CbB4eP-WfC97QxW4';
  res.json({ publicKey: VAPID_PUBLIC_KEY });
});

// Save push subscription
notifRouter.post('/subscribe', authenticateToken, (req, res) => {
  const db = getDb();
  const subscription = req.body;
  
  db.prepare('UPDATE users SET push_subscription = ? WHERE id = ?').run(
    JSON.stringify(subscription),
    req.user.id
  );
  
  res.status(201).json({ message: 'Subscription saved' });
});

// SETTINGS

settingsRouter.get('/', authenticateToken, (req, res) => {
  const db = getDb();
  let settings = db.prepare('SELECT * FROM settings WHERE user_id = ?').get(req.user.id);
  
  if (!settings) {
    const id = uuidv4();
    db.prepare('INSERT INTO settings (id, user_id) VALUES (?, ?)').run(id, req.user.id);
    settings = db.prepare('SELECT * FROM settings WHERE user_id = ?').get(req.user.id);
  }
  
  res.json({ settings });
});

settingsRouter.put('/', authenticateToken, (req, res) => {
  const db = getDb();
  const {
    theme, language, notifications_enabled, medication_reminders,
    appointment_reminders, health_tips, ai_suggestions,
    data_sharing, two_factor_auth, biometric_login
  } = req.body;
  
  db.prepare(`
    UPDATE settings SET
      theme = COALESCE(?, theme),
      language = COALESCE(?, language),
      notifications_enabled = COALESCE(?, notifications_enabled),
      medication_reminders = COALESCE(?, medication_reminders),
      appointment_reminders = COALESCE(?, appointment_reminders),
      health_tips = COALESCE(?, health_tips),
      ai_suggestions = COALESCE(?, ai_suggestions),
      data_sharing = COALESCE(?, data_sharing),
      two_factor_auth = COALESCE(?, two_factor_auth),
      biometric_login = COALESCE(?, biometric_login),
      updated_at = CURRENT_TIMESTAMP
    WHERE user_id = ?
  `).run(
    theme, language,
    notifications_enabled !== undefined ? (notifications_enabled ? 1 : 0) : null,
    medication_reminders !== undefined ? (medication_reminders ? 1 : 0) : null,
    appointment_reminders !== undefined ? (appointment_reminders ? 1 : 0) : null,
    health_tips !== undefined ? (health_tips ? 1 : 0) : null,
    ai_suggestions !== undefined ? (ai_suggestions ? 1 : 0) : null,
    data_sharing !== undefined ? (data_sharing ? 1 : 0) : null,
    two_factor_auth !== undefined ? (two_factor_auth ? 1 : 0) : null,
    biometric_login !== undefined ? (biometric_login ? 1 : 0) : null,
    req.user.id
  );
  
  const updated = db.prepare('SELECT * FROM settings WHERE user_id = ?').get(req.user.id);
  res.json({ settings: updated, message: 'Settings updated' });
});

// GET Active Sessions
settingsRouter.get('/sessions', authenticateToken, (req, res) => {
  const db = getDb();
  const sessions = db.prepare('SELECT id, device_info, ip_address, created_at, last_active, is_active FROM sessions WHERE user_id = ? ORDER BY last_active DESC').all(req.user.id);
  res.json({ sessions });
});

// Sign out all devices
settingsRouter.post('/sessions/signout-all', authenticateToken, (req, res) => {
  const db = getDb();
  // Set all sessions to inactive except the current one
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  db.prepare('UPDATE sessions SET is_active = 0 WHERE user_id = ? AND token != ?').run(req.user.id, token);
  res.json({ message: 'Signed out of all other devices' });
});

// GET Activity Logs
settingsRouter.get('/activity', authenticateToken, (req, res) => {
  const db = getDb();
  const logs = db.prepare('SELECT * FROM analytics WHERE user_id = ? ORDER BY created_at DESC LIMIT 100').all(req.user.id);
  res.json({ logs });
});

// Export Data
settingsRouter.get('/export', authenticateToken, (req, res) => {
  const db = getDb();
  const userId = req.user.id;
  
  const user = db.prepare('SELECT id, email, created_at FROM users WHERE id = ?').get(userId);
  const profile = db.prepare('SELECT * FROM profiles WHERE user_id = ?').get(userId);
  const settings = db.prepare('SELECT * FROM settings WHERE user_id = ?').get(userId);
  const health_records = db.prepare('SELECT * FROM health_records WHERE user_id = ?').all(userId);
  const medications = db.prepare('SELECT * FROM medications WHERE user_id = ?').all(userId);
  const appointments = db.prepare('SELECT * FROM appointments WHERE user_id = ?').all(userId);
  const reports = db.prepare('SELECT * FROM reports WHERE user_id = ?').all(userId);
  const ai_memory = db.prepare('SELECT * FROM ai_memory WHERE user_id = ?').all(userId);
  
  const exportData = {
    exported_at: new Date().toISOString(),
    user,
    profile,
    settings,
    health_records,
    medications,
    appointments,
    reports,
    ai_memory
  };
  
  res.setHeader('Content-disposition', 'attachment; filename=carebot-data-export.json');
  res.setHeader('Content-type', 'application/json');
  res.send(JSON.stringify(exportData, null, 2));
});

module.exports = { notifRouter, settingsRouter };
