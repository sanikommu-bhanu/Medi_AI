const { getDb } = require('../db/database');
const { v4: uuidv4 } = require('uuid');

function logActivity(eventType, req, userOverride = null) {
  try {
    const db = getDb();
    const userId = userOverride ? userOverride.id : (req.user ? req.user.id : null);
    
    if (!userId) return; // Cannot log activity without a user context
    
    // Minimal request context
    const eventData = JSON.stringify({
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      path: req.originalUrl
    });

    db.prepare(`
      INSERT INTO analytics (id, user_id, event_type, event_data)
      VALUES (?, ?, ?, ?)
    `).run(uuidv4(), userId, eventType, eventData);
  } catch (err) {
    console.error('Failed to log activity:', err);
  }
}

// Middleware factory for specific routes
const activityLogger = (eventType) => {
  return (req, res, next) => {
    // Intercept response finish to log only on success, or log immediately?
    // Let's log immediately, but maybe wait for finish if we need status
    res.on('finish', () => {
      if (res.statusCode >= 200 && res.statusCode < 400) {
        logActivity(eventType, req);
      }
    });
    next();
  };
};

module.exports = { logActivity, activityLogger };
