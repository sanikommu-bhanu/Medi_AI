const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../db/database');
const { authenticateToken } = require('../middleware/auth');
const aiService = require('../services/aiService');

const router = express.Router();

// Get all conversations
router.get('/conversations', authenticateToken, (req, res) => {
  const db = getDb();
  const conversations = db.prepare(`
    SELECT c.*, 
           (SELECT content FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message,
           (SELECT COUNT(*) FROM messages WHERE conversation_id = c.id) as message_count
    FROM conversations c
    WHERE c.user_id = ?
    ORDER BY c.updated_at DESC
  `).all(req.user.id);
  
  res.json({ conversations });
});

// Create new conversation
router.post('/conversations', authenticateToken, (req, res) => {
  const db = getDb();
  const { title } = req.body;
  const id = uuidv4();
  
  db.prepare('INSERT INTO conversations (id, user_id, title) VALUES (?, ?, ?)').run(
    id, req.user.id, title || 'New Conversation'
  );
  
  const conversation = db.prepare('SELECT * FROM conversations WHERE id = ?').get(id);
  res.status(201).json({ conversation });
});

// Get messages for a conversation
router.get('/conversations/:id/messages', authenticateToken, (req, res) => {
  const db = getDb();
  
  const conversation = db.prepare('SELECT * FROM conversations WHERE id = ? AND user_id = ?').get(
    req.params.id, req.user.id
  );
  
  if (!conversation) {
    return res.status(404).json({ error: 'Conversation not found' });
  }
  
  const messages = db.prepare(`
    SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC
  `).all(req.params.id);
  
  res.json({ messages });
});

// Send message and get AI response
router.post('/conversations/:id/messages', authenticateToken, async (req, res) => {
  const db = getDb();
  const { content } = req.body;
  
  if (!content || !content.trim()) {
    return res.status(400).json({ error: 'Message content is required' });
  }

  const conversation = db.prepare('SELECT * FROM conversations WHERE id = ? AND user_id = ?').get(
    req.params.id, req.user.id
  );
  
  if (!conversation) {
    return res.status(404).json({ error: 'Conversation not found' });
  }

  try {
    // Save user message
    const userMsgId = uuidv4();
    db.prepare(`
      INSERT INTO messages (id, conversation_id, user_id, role, content) VALUES (?, ?, ?, 'user', ?)
    `).run(userMsgId, req.params.id, req.user.id, content.trim());

    // Get conversation history (last 20 messages for context)
    const history = db.prepare(`
      SELECT role, content FROM messages 
      WHERE conversation_id = ? 
      ORDER BY created_at ASC 
      LIMIT 20
    `).all(req.params.id);

    // Get user profile and AI memory
    const profile = db.prepare('SELECT * FROM profiles WHERE user_id = ?').get(req.user.id);
    const aiMemory = db.prepare(`
      SELECT key, value FROM ai_memory WHERE user_id = ? ORDER BY updated_at DESC LIMIT 10
    `).all(req.user.id);

    // Build system prompt
    const systemPrompt = aiService.buildHealthSystemPrompt(profile, aiMemory);

    // Get AI response
    const aiResponse = await aiService.chat(history, systemPrompt);

    // Save AI message
    const aiMsgId = uuidv4();
    db.prepare(`
      INSERT INTO messages (id, conversation_id, user_id, role, content, metadata) VALUES (?, ?, ?, 'assistant', ?, ?)
    `).run(aiMsgId, req.params.id, req.user.id, aiResponse.text, JSON.stringify({ provider: aiResponse.provider }));

    // Update conversation timestamp and title if first message
    if (history.length <= 1) {
      const title = content.length > 50 ? content.substring(0, 50) + '...' : content;
      db.prepare('UPDATE conversations SET title = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(
        title, req.params.id
      );
    } else {
      db.prepare('UPDATE conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(req.params.id);
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Extract and save AI memory if important info mentioned
    await extractAndSaveMemory(db, req.user.id, content, aiResponse.text);

    // Initial message metadata
    res.write(`data: ${JSON.stringify({ type: 'metadata', userMessage: { id: userMsgId, role: 'user', content: content.trim() }, aiMessageId: aiMsgId, provider: aiResponse.provider })}\n\n`);

    // Stream response word by word
    const words = aiResponse.text.split(' ');
    for (let i = 0; i < words.length; i++) {
      res.write(`data: ${JSON.stringify({ type: 'chunk', chunk: words[i] + (i === words.length - 1 ? '' : ' ') })}\n\n`);
      await new Promise(r => setTimeout(r, 30));
    }
    
    // Check for actions (e.g. book appointment)
    if (content.toLowerCase().includes('book') && content.toLowerCase().includes('appointment')) {
      const aptId = uuidv4();
      db.prepare(`INSERT INTO appointments (id, user_id, doctor_name, appointment_date, appointment_time, type) VALUES (?, ?, ?, ?, ?, ?)`).run(aptId, req.user.id, 'Dr. AI Recommended', new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0], '10:00', 'in-person');
      res.write(`data: ${JSON.stringify({ type: 'action', action: 'appointment_created', message: 'Appointment created ✓' })}\n\n`);
    }

    res.write(`data: [DONE]\n\n`);
    res.end();
  } catch (err) {
    console.error('Chat error:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to get AI response' });
    } else {
      res.write(`data: ${JSON.stringify({ type: 'error', error: 'Failed to get AI response' })}\n\n`);
      res.end();
    }
  }
});

// Quick chat (no conversation persistence)
router.post('/quick-chat', authenticateToken, async (req, res) => {
  const { message, history = [] } = req.body;
  
  if (!message) return res.status(400).json({ error: 'Message required' });

  const profile = db.prepare('SELECT * FROM profiles WHERE user_id = ?').get(req.user.id);
  const systemPrompt = aiService.buildHealthSystemPrompt(profile, []);
  
  const messages = [...history, { role: 'user', content: message }];
  const response = await aiService.chat(messages, systemPrompt);
  
  res.json({ response: response.text, provider: response.provider });
});

// AI Memory
router.get('/memory', authenticateToken, (req, res) => {
  const db = getDb();
  const memory = db.prepare('SELECT * FROM ai_memory WHERE user_id = ? ORDER BY updated_at DESC').all(req.user.id);
  res.json({ memory });
});

router.delete('/memory/:id', authenticateToken, (req, res) => {
  const db = getDb();
  db.prepare('DELETE FROM ai_memory WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
  res.json({ message: 'Memory deleted' });
});

async function extractAndSaveMemory(db, userId, userMessage, aiResponse) {
  const keywords = {
    allerg: 'allergies',
    medic: 'medications',
    condition: 'conditions',
    doctor: 'doctor',
    hospital: 'hospital',
    symptom: 'symptoms',
    pain: 'symptoms',
    blood: 'vitals',
    pressure: 'vitals'
  };

  for (const [keyword, category] of Object.entries(keywords)) {
    if (userMessage.toLowerCase().includes(keyword)) {
      const existingMemory = db.prepare(
        'SELECT id FROM ai_memory WHERE user_id = ? AND category = ? LIMIT 1'
      ).get(userId, category);
      
      if (!existingMemory) {
        db.prepare(`
          INSERT INTO ai_memory (id, user_id, key, value, category) VALUES (?, ?, ?, ?, ?)
        `).run(uuidv4(), userId, `Recent ${category}`, userMessage.substring(0, 200), category);
      }
      break;
    }
  }
}

module.exports = router;
