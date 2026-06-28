const express = require('express');
const { getDb } = require('../db/database');
const { authenticateToken } = require('../middleware/auth');
const { encrypt, decrypt } = require('../utils/crypto');
const { logActivity } = require('../middleware/logger');

const router = express.Router();

// Get profile
router.get('/', authenticateToken, (req, res) => {
  const db = getDb();
  const profile = db.prepare('SELECT * FROM profiles WHERE user_id = ?').get(req.user.id);
  
  if (profile) {
    if (profile.allergies) profile.allergies = decrypt(profile.allergies);
    if (profile.chronic_conditions) profile.chronic_conditions = decrypt(profile.chronic_conditions);
  }
  
  res.json({ profile });
});

// Update profile
router.put('/', authenticateToken, (req, res) => {
  const db = getDb();
  const {
    full_name, date_of_birth, gender, blood_type, height, weight,
    address, phone, emergency_contact_name, emergency_contact_phone,
    primary_physician, insurance_provider, insurance_id,
    allergies, chronic_conditions, avatar_url, onboarding_completed
  } = req.body;

  const existing = db.prepare('SELECT id FROM profiles WHERE user_id = ?').get(req.user.id);
  
  if (!existing) {
    return res.status(404).json({ error: 'Profile not found' });
  }

  db.prepare(`
    UPDATE profiles SET
      full_name = COALESCE(?, full_name),
      date_of_birth = COALESCE(?, date_of_birth),
      gender = COALESCE(?, gender),
      blood_type = COALESCE(?, blood_type),
      height = COALESCE(?, height),
      weight = COALESCE(?, weight),
      address = COALESCE(?, address),
      phone = COALESCE(?, phone),
      emergency_contact_name = COALESCE(?, emergency_contact_name),
      emergency_contact_phone = COALESCE(?, emergency_contact_phone),
      primary_physician = COALESCE(?, primary_physician),
      insurance_provider = COALESCE(?, insurance_provider),
      insurance_id = COALESCE(?, insurance_id),
      allergies = COALESCE(?, allergies),
      chronic_conditions = COALESCE(?, chronic_conditions),
      avatar_url = COALESCE(?, avatar_url),
      onboarding_completed = COALESCE(?, onboarding_completed),
      updated_at = CURRENT_TIMESTAMP
    WHERE user_id = ?
  `).run(
    full_name, date_of_birth, gender, blood_type, height, weight,
    address, phone, emergency_contact_name, emergency_contact_phone,
    primary_physician, insurance_provider, insurance_id,
    allergies !== undefined ? encrypt(allergies) : null,
    chronic_conditions !== undefined ? encrypt(chronic_conditions) : null,
    avatar_url, onboarding_completed,
    req.user.id
  );

  const updated = db.prepare('SELECT * FROM profiles WHERE user_id = ?').get(req.user.id);
  if (updated) {
    if (updated.allergies) updated.allergies = decrypt(updated.allergies);
    if (updated.chronic_conditions) updated.chronic_conditions = decrypt(updated.chronic_conditions);
  }
  
  logActivity('PROFILE_UPDATE', req);
  res.json({ profile: updated, message: 'Profile updated successfully' });
});

// Get health summary
router.get('/health-summary', authenticateToken, (req, res) => {
  const db = getDb();
  
  const vitals = db.prepare(`
    SELECT record_type, value, unit, recorded_at
    FROM health_records 
    WHERE user_id = ? 
    GROUP BY record_type
    HAVING recorded_at = MAX(recorded_at)
    ORDER BY recorded_at DESC
  `).all(req.user.id);

  const recentRecords = db.prepare(`
    SELECT * FROM health_records
    WHERE user_id = ?
    ORDER BY recorded_at DESC
    LIMIT 10
  `).all(req.user.id);

  res.json({ vitals, recentRecords });
});

module.exports = router;
