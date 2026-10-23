// src/routes/userRoutes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const { auditUserContent } = require('../controllers/userController');

const upload = multer({ dest: 'uploads/' });

// POST route: /api/user/audit (Supports both JSON text and multipart file upload under 'file' field)
router.post('/audit', upload.single('file'), auditUserContent);

module.exports = router;