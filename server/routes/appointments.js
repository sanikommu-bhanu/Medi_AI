const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../db/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get all appointments
router.get('/', authenticateToken, (req, res) => {
  const db = getDb();
  const { status } = req.query;
  
  let query = 'SELECT * FROM appointments WHERE user_id = ?';
  const params = [req.user.id];
  
  if (status) {
    query += ' AND status = ?';
    params.push(status);
  }
  
  query += ' ORDER BY appointment_date ASC, appointment_time ASC';
  
  const appointments = db.prepare(query).all(...params);
  res.json({ appointments });
});

// Create appointment
router.post('/', authenticateToken, (req, res) => {
  const db = getDb();
  const {
    doctor_name, specialty, location, appointment_date, appointment_time,
    duration_minutes, type, notes
  } = req.body;
  
  if (!doctor_name || !appointment_date || !appointment_time) {
    return res.status(400).json({ error: 'Doctor name, date, and time are required' });
  }
  
  const id = uuidv4();
  db.prepare(`
    INSERT INTO appointments (id, user_id, doctor_name, specialty, location, appointment_date, appointment_time, duration_minutes, type, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, req.user.id, doctor_name, specialty, location, appointment_date, appointment_time,
    duration_minutes || 30, type || 'in-person', notes);

  // Create notification
  const notifId = uuidv4();
  db.prepare(`
    INSERT INTO notifications (id, user_id, title, body, type)
    VALUES (?, ?, ?, ?, ?)
  `).run(notifId, req.user.id, 'Appointment Scheduled',
    `Your appointment with ${doctor_name} on ${appointment_date} at ${appointment_time} has been scheduled.`,
    'appointment');

  const appointment = db.prepare('SELECT * FROM appointments WHERE id = ?').get(id);
  res.status(201).json({ appointment, message: 'Appointment scheduled successfully' });
});

// Update appointment
router.put('/:id', authenticateToken, (req, res) => {
  const db = getDb();
  const { doctor_name, specialty, location, appointment_date, appointment_time, duration_minutes, type, status, notes } = req.body;
  
  const existing = db.prepare('SELECT * FROM appointments WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!existing) return res.status(404).json({ error: 'Appointment not found' });
  
  db.prepare(`
    UPDATE appointments SET
      doctor_name = COALESCE(?, doctor_name),
      specialty = COALESCE(?, specialty),
      location = COALESCE(?, location),
      appointment_date = COALESCE(?, appointment_date),
      appointment_time = COALESCE(?, appointment_time),
      duration_minutes = COALESCE(?, duration_minutes),
      type = COALESCE(?, type),
      status = COALESCE(?, status),
      notes = COALESCE(?, notes),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ? AND user_id = ?
  `).run(doctor_name, specialty, location, appointment_date, appointment_time,
    duration_minutes, type, status, notes, req.params.id, req.user.id);
  
  const updated = db.prepare('SELECT * FROM appointments WHERE id = ?').get(req.params.id);
  res.json({ appointment: updated, message: 'Appointment updated' });
});

// Delete appointment
router.delete('/:id', authenticateToken, (req, res) => {
  const db = getDb();
  const result = db.prepare('DELETE FROM appointments WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
  
  if (result.changes === 0) return res.status(404).json({ error: 'Appointment not found' });
  res.json({ message: 'Appointment cancelled' });
});

// Get upcoming appointments
router.get('/upcoming', authenticateToken, (req, res) => {
  const db = getDb();
  const appointments = db.prepare(`
    SELECT * FROM appointments 
    WHERE user_id = ? AND appointment_date >= date('now') AND status = 'upcoming'
    ORDER BY appointment_date ASC, appointment_time ASC
    LIMIT 5
  `).all(req.user.id);
  
  res.json({ appointments });
});

module.exports = router;
