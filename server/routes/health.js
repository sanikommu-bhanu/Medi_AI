const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../db/database');
const { authenticateToken } = require('../middleware/auth');
const { encrypt, decrypt } = require('../utils/crypto');

const router = express.Router();

// Get all health records
router.get('/', authenticateToken, (req, res) => {
  const db = getDb();
  const { type, limit = 50, offset = 0 } = req.query;
  
  let query = 'SELECT * FROM health_records WHERE user_id = ?';
  const params = [req.user.id];
  
  if (type) {
    query += ' AND record_type = ?';
    params.push(type);
  }
  
  query += ' ORDER BY recorded_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), parseInt(offset));
  
  const records = db.prepare(query).all(...params);
  const total = db.prepare('SELECT COUNT(*) as count FROM health_records WHERE user_id = ?').get(req.user.id);
  
  // Decrypt sensitive fields
  const decryptedRecords = records.map(r => ({
    ...r,
    value: decrypt(r.value),
    notes: decrypt(r.notes)
  }));
  
  res.json({ records: decryptedRecords, total: total.count });
});

// Add health record
router.post('/', authenticateToken, (req, res) => {
  const db = getDb();
  const { record_type, title, value, unit, notes, recorded_at } = req.body;
  
  if (!record_type || !title) {
    return res.status(400).json({ error: 'Record type and title are required' });
  }
  
  const id = uuidv4();
  db.prepare(`
    INSERT INTO health_records (id, user_id, record_type, title, value, unit, notes, recorded_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, COALESCE(?, CURRENT_TIMESTAMP))
  `).run(id, req.user.id, record_type, title, encrypt(value), unit, encrypt(notes), recorded_at);
  
  const record = db.prepare('SELECT * FROM health_records WHERE id = ?').get(id);
  record.value = decrypt(record.value);
  record.notes = decrypt(record.notes);
  
  res.status(201).json({ record, message: 'Health record added' });
});

// Get vital trends (for charts)
router.get('/trends/:type', authenticateToken, (req, res) => {
  const db = getDb();
  const records = db.prepare(`
    SELECT value, unit, recorded_at 
    FROM health_records 
    WHERE user_id = ? AND record_type = ?
    ORDER BY recorded_at DESC
    LIMIT 30
  `).all(req.user.id, req.params.type);
  
  const decryptedRecords = records.map(r => ({ ...r, value: decrypt(r.value) }));
  res.json({ records: decryptedRecords.reverse() });
});

// Get health stats
router.get('/stats', authenticateToken, (req, res) => {
  const db = getDb();
  
  const stats = {
    totalRecords: db.prepare('SELECT COUNT(*) as count FROM health_records WHERE user_id = ?').get(req.user.id)?.count || 0,
    totalReports: db.prepare('SELECT COUNT(*) as count FROM reports WHERE user_id = ?').get(req.user.id)?.count || 0,
    upcomingAppointments: db.prepare(`
      SELECT COUNT(*) as count FROM appointments 
      WHERE user_id = ? AND status = 'upcoming' AND appointment_date >= date('now')
    `).get(req.user.id)?.count || 0,
    activeMedications: db.prepare(`
      SELECT COUNT(*) as count FROM medications WHERE user_id = ? AND is_active = 1
    `).get(req.user.id)?.count || 0,
    latestVitals: {}
  };

  const vitalTypes = ['blood_pressure', 'heart_rate', 'blood_sugar', 'weight', 'temperature', 'oxygen', 'water', 'sleep', 'mood'];
  for (const type of vitalTypes) {
    const latest = db.prepare(`
      SELECT value, unit, recorded_at FROM health_records 
      WHERE user_id = ? AND record_type = ?
      ORDER BY recorded_at DESC LIMIT 1
    `).get(req.user.id, type);
    if (latest) {
      latest.value = decrypt(latest.value);
      stats.latestVitals[type] = latest;
    }
  }

  res.json({ stats });
});

// Delete health record
router.delete('/:id', authenticateToken, (req, res) => {
  const db = getDb();
  const result = db.prepare('DELETE FROM health_records WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
  
  if (result.changes === 0) {
    return res.status(404).json({ error: 'Record not found' });
  }
  
  res.json({ message: 'Record deleted' });
});

module.exports = router;
