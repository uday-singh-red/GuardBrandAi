// src/routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const upload = require('../middlewares/uploadMiddleware'); // Jo humne pehle banaya tha
const adminController = require('../controllers/adminController');

// POST /api/admin/upload-file-guideline (Yeh file accept karega)
router.post('/upload-file-guideline', upload.single('file'), adminController.uploadAndEmbedFile);

module.exports = router;