const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const pdfParse = require('pdf-parse');
const { getDb } = require('../db/database');
const { authenticateToken } = require('../middleware/auth');
const aiService = require('../services/aiService');

const router = express.Router();

const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}-${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowed = ['.pdf', '.jpg', '.jpeg', '.png', '.txt', '.docx'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) cb(null, true);
    else cb(new Error('Invalid file type. Allowed: PDF, images, TXT, DOCX'));
  }
});

// Get all reports
router.get('/', authenticateToken, (req, res) => {
  const db = getDb();
  const reports = db.prepare(`
    SELECT * FROM reports WHERE user_id = ? ORDER BY uploaded_at DESC
  `).all(req.user.id);
  
  res.json({ reports });
});

// Upload report
router.post('/upload', authenticateToken, upload.single('report'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  
  const db = getDb();
  const { report_type } = req.body;
  
  const id = uuidv4();
  db.prepare(`
    INSERT INTO reports (id, user_id, filename, original_name, file_type, file_size, file_path, report_type, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')
  `).run(id, req.user.id, req.file.filename, req.file.originalname,
    req.file.mimetype, req.file.size, req.file.path, report_type || 'general');

  // Trigger async analysis
  analyzeReportAsync(db, id, req.file, report_type, req.user.id);

  const report = db.prepare('SELECT * FROM reports WHERE id = ?').get(id);
  res.status(201).json({ report, message: 'Report uploaded. Analysis in progress...' });
});

async function analyzeReportAsync(db, reportId, file, reportType, userId) {
  try {
    let content = '';
    
    // Extract text from file
    if (file.mimetype === 'text/plain') {
      content = fs.readFileSync(file.path, 'utf-8');
    } else if (file.mimetype === 'application/pdf') {
      const dataBuffer = fs.readFileSync(file.path);
      const pdfData = await pdfParse(dataBuffer);
      content = pdfData.text;
    } else {
      // For images, use filename and type for AI analysis
      content = `Medical ${reportType || 'health'} report: ${file.originalname}. 
      File type: ${file.mimetype}. 
      Please provide a general analysis template for this type of medical document.`;
    }

    const analysis = await aiService.analyzeReport(content, reportType);
    
    db.prepare(`
      UPDATE reports SET
        analysis = ?,
        summary = ?,
        key_findings = ?,
        status = 'analyzed',
        analyzed_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      typeof analysis === 'object' ? JSON.stringify(analysis) : analysis,
      analysis.summary || 'Analysis complete',
      JSON.stringify(analysis.keyFindings || []),
      reportId
    );

    // Create notification
    const notifId = uuidv4();
    db.prepare(`
      INSERT INTO notifications (id, user_id, title, body, type)
      VALUES (?, ?, ?, ?, ?)
    `).run(notifId, userId, 'Report Analysis Complete',
      `Your medical report has been analyzed. View the insights in your reports section.`,
      'report');

  } catch (err) {
    console.error('Report analysis error:', err);
    db.prepare(`UPDATE reports SET status = 'error' WHERE id = ?`).run(reportId);
  }
}

// Get report details
router.get('/:id', authenticateToken, (req, res) => {
  const db = getDb();
  const report = db.prepare('SELECT * FROM reports WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  
  if (!report) return res.status(404).json({ error: 'Report not found' });
  
  // Parse JSON fields
  if (report.analysis) {
    try { report.analysis = JSON.parse(report.analysis); } catch (e) {}
  }
  if (report.key_findings) {
    try { report.key_findings = JSON.parse(report.key_findings); } catch (e) {}
  }
  
  res.json({ report });
});

// Delete report
router.delete('/:id', authenticateToken, (req, res) => {
  const db = getDb();
  const report = db.prepare('SELECT * FROM reports WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  
  if (!report) return res.status(404).json({ error: 'Report not found' });
  
  // Delete file
  if (fs.existsSync(report.file_path)) {
    fs.unlinkSync(report.file_path);
  }
  
  db.prepare('DELETE FROM reports WHERE id = ?').run(req.params.id);
  res.json({ message: 'Report deleted' });
});

module.exports = router;
