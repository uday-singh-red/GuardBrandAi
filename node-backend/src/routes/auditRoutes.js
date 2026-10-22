// src/routes/auditRoutes.js
const express = require('express');
const router = express.Router();
const upload = require('../middlewares/uploadMiddleware');
const fileAuditController = require('../controllers/fileAuditController');

// POST /api/audit/upload
router.post('/upload', upload.single('file'), fileAuditController.processAuditFile);

module.exports = router;