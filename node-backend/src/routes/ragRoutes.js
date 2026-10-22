// src/routes/ragRoutes.js
const express = require('express');
const router = express.Router();
const ragController = require('../controllers/ragController');

// Admin route to ingest company guidelines
router.post('/admin/upload-guideline', ragController.uploadGuideline);

// User route to check post/blog compliance via RAG
router.post('/user/audit-text', ragController.auditUserPost);

module.exports = router;