const cron = require('node-cron');
const { getDb } = require('../db/database');
const { v4: uuidv4 } = require('uuid');
const webpush = require('web-push');

// Setup web-push (keys should be in ENV for production)
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBtc3sOE_CbB4eP-WfC97QxW4';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || 'x-1P3NqyO-bYq9-bXh46G6qW3494H6vXWqH6W464-9w';

webpush.setVapidDetails(
  'mailto:support@carebot.app',
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
);

function sendPushNotification(subscription, payload) {
  if (!subscription) return;
  try {
    const sub = JSON.parse(subscription);
    webpush.sendNotification(sub, JSON.stringify(payload)).catch(err => console.error('Push error:', err));
  } catch (e) {
    console.error('Push parse error:', e);
  }
}

function startCronJobs() {
  const db = getDb();
  
  // Every hour check for medications due soon
  cron.schedule('0 * * * *', () => {
    console.log('Running hourly medication check...');
    // In a real app we'd compare time with med schedules
    // For now we'll just mock it and send a reminder if they have active meds
    const users = db.prepare('SELECT id, push_subscription FROM users').all();
    
    users.forEach(user => {
      const pendingMeds = db.prepare('SELECT id, name FROM medications WHERE user_id = ? AND is_active = 1 AND taken_today = 0 LIMIT 1').all(user.id);
      
      if (pendingMeds.length > 0) {
        const notifId = uuidv4();
        db.prepare('INSERT INTO notifications (id, user_id, title, body, type) VALUES (?, ?, ?, ?, ?)').run(
          notifId, user.id, 'Medication Reminder', `Don't forget to take your ${pendingMeds[0].name}`, 'medication'
        );
        
        if (user.push_subscription) {
          sendPushNotification(user.push_subscription, {
            title: 'Medication Reminder',
            body: `Don't forget to take your ${pendingMeds[0].name}`,
            icon: '/icon-192x192.png'
          });
        }
      }
    });
  });

  // Every morning at 8 AM (Daily Tip)
  cron.schedule('0 8 * * *', () => {
    console.log('Running daily 8 AM tip...');
    const users = db.prepare('SELECT id, push_subscription FROM users').all();
    
    users.forEach(user => {
      const tips = [
        "Drink a glass of water to start your day right!",
        "Take a 5 minute walk after breakfast for better digestion.",
        "Remember to track your vitals today.",
        "Take deep breaths to manage stress.",
        "Ensure you get 7-9 hours of sleep tonight."
      ];
      const randomTip = tips[Math.floor(Math.random() * tips.length)];
      
      const notifId = uuidv4();
      db.prepare('INSERT INTO notifications (id, user_id, title, body, type) VALUES (?, ?, ?, ?, ?)').run(
        notifId, user.id, 'Daily Health Tip', randomTip, 'info'
      );
      
      if (user.push_subscription) {
        sendPushNotification(user.push_subscription, {
          title: 'CareBot Daily Tip',
          body: randomTip,
          icon: '/icon-192x192.png'
        });
      }
    });
  });
  
  console.log('Cron jobs started');
}

module.exports = { startCronJobs, webpush, VAPID_PUBLIC_KEY };
