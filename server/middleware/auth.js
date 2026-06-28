const jwt = require('jsonwebtoken');
const { getDb } = require('../db/database');

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'carebot_secret');
    const db = getDb();
    const user = db.prepare('SELECT id, email, is_active FROM users WHERE id = ?').get(decoded.userId);
    
    if (!user || !user.is_active) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
    
    req.user = user;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid token' });
  }
}

module.exports = { authenticateToken };
