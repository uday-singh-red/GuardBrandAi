const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({ dest: 'uploads/' }); // Temporary file storage
const { handleAuditRequest } = require('../controllers/auditController');

// Jab frontend se audit request aayegi (text ya file ke sath)
router.post('/audit', upload.single('file'), handleAuditRequest);

module.exports = router;