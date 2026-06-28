const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../db/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get all medications
router.get('/', authenticateToken, (req, res) => {
  const db = getDb();
  const { active } = req.query;
  
  let query = 'SELECT * FROM medications WHERE user_id = ?';
  const params = [req.user.id];
  
  if (active !== undefined) {
    query += ' AND is_active = ?';
    params.push(active === 'true' ? 1 : 0);
  }
  
  query += ' ORDER BY created_at DESC';
  const medications = db.prepare(query).all(...params);
  res.json({ medications });
});

// Add medication
router.post('/', authenticateToken, (req, res) => {
  const db = getDb();
  const { name, dosage, frequency, times, start_date, end_date, instructions, prescribing_doctor, refill_date } = req.body;
  
  if (!name) return res.status(400).json({ error: 'Medication name is required' });
  
  const id = uuidv4();
  db.prepare(`
    INSERT INTO medications (id, user_id, name, dosage, frequency, times, start_date, end_date, instructions, prescribing_doctor, refill_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, req.user.id, name, dosage, frequency, 
    Array.isArray(times) ? JSON.stringify(times) : times,
    start_date, end_date, instructions, prescribing_doctor, refill_date);

  // Create notification
  const notifId = uuidv4();
  db.prepare(`
    INSERT INTO notifications (id, user_id, title, body, type)
    VALUES (?, ?, ?, ?, ?)
  `).run(notifId, req.user.id, 'Medication Added',
    `${name} has been added to your medication list.`, 'medication');

  const medication = db.prepare('SELECT * FROM medications WHERE id = ?').get(id);
  res.status(201).json({ medication, message: 'Medication added successfully' });
});

// Update medication
router.put('/:id', authenticateToken, (req, res) => {
  const db = getDb();
  const { name, dosage, frequency, times, start_date, end_date, instructions, prescribing_doctor, refill_date, is_active } = req.body;
  
  const existing = db.prepare('SELECT * FROM medications WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!existing) return res.status(404).json({ error: 'Medication not found' });
  
  db.prepare(`
    UPDATE medications SET
      name = COALESCE(?, name),
      dosage = COALESCE(?, dosage),
      frequency = COALESCE(?, frequency),
      times = COALESCE(?, times),
      start_date = COALESCE(?, start_date),
      end_date = COALESCE(?, end_date),
      instructions = COALESCE(?, instructions),
      prescribing_doctor = COALESCE(?, prescribing_doctor),
      refill_date = COALESCE(?, refill_date),
      is_active = COALESCE(?, is_active),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ? AND user_id = ?
  `).run(name, dosage, frequency,
    times ? (Array.isArray(times) ? JSON.stringify(times) : times) : null,
    start_date, end_date, instructions, prescribing_doctor, refill_date,
    is_active !== undefined ? (is_active ? 1 : 0) : null,
    req.params.id, req.user.id);
  
  const updated = db.prepare('SELECT * FROM medications WHERE id = ?').get(req.params.id);
  res.json({ medication: updated, message: 'Medication updated' });
});

// Log medication taken
router.post('/:id/log', authenticateToken, (req, res) => {
  const db = getDb();
  const { status, notes } = req.body;
  
  const medication = db.prepare('SELECT * FROM medications WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!medication) return res.status(404).json({ error: 'Medication not found' });
  
  const id = uuidv4();
  db.prepare(`
    INSERT INTO medication_logs (id, medication_id, user_id, status, notes) VALUES (?, ?, ?, ?, ?)
  `).run(id, req.params.id, req.user.id, status || 'taken', notes);
  
  res.status(201).json({ message: 'Medication logged successfully' });
});

// Get medication logs
router.get('/:id/logs', authenticateToken, (req, res) => {
  const db = getDb();
  const logs = db.prepare(`
    SELECT * FROM medication_logs WHERE medication_id = ? AND user_id = ? ORDER BY taken_at DESC LIMIT 30
  `).all(req.params.id, req.user.id);
  
  res.json({ logs });
});

// Delete medication
router.delete('/:id', authenticateToken, (req, res) => {
  const db = getDb();
  const result = db.prepare('DELETE FROM medications WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Medication not found' });
  res.json({ message: 'Medication removed' });
});

// Get today's medications
router.get('/today/schedule', authenticateToken, (req, res) => {
  const db = getDb();
  const medications = db.prepare(`
    SELECT m.*, 
           (SELECT COUNT(*) FROM medication_logs ml 
            WHERE ml.medication_id = m.id 
            AND date(ml.taken_at) = date('now')
            AND ml.status = 'taken') as taken_today
    FROM medications m
    WHERE m.user_id = ? AND m.is_active = 1
    ORDER BY m.name
  `).all(req.user.id);
  
  res.json({ medications });
});

module.exports = router;
