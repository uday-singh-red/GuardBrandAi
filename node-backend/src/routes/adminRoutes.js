// src/routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { uploadGuidelinePDF } = require('../controllers/adminController');

// Ensure karo ki uploads folder pehle se exist karta ho
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer storage configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + '-' + file.originalname);
    }
});

// File filter taaki sirf PDF hi upload ho sake
const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only PDF files are allowed!'), false);
    }
};

const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter,

});

// POST Route: /api/admin/upload
router.post('/upload', upload.single('pdf'), uploadGuidelinePDF);

router.get('/upload', async (req, res) => {
  try {
    // Apne Database/Guideline model se documents fetch karein
    // const guidelines = await Guideline.find().sort({ createdAt: -1 });
    res.json({ success: true, guidelines: [] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;