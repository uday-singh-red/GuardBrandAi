// src/routes/userRoutes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const { protect } = require('../middlewares/authMiddleware');
const { auditUserContent , registerUser , verifyOTP , resendOTP , loginUser , checkAuth , logoutUser} = require('../controllers/userController');

const upload = multer({ dest: 'uploads/' });

// POST route: /api/user/audit (Supports both JSON text and multipart file upload under 'file' field)
router.post('/audit', upload.single('file'), auditUserContent);

router.post('/register', registerUser);
router.post('/verify-otp', verifyOTP);
router.post('/resend-otp', resendOTP);
router.post('/login', loginUser);
router.get('/check-auth', protect, checkAuth);
router.post('/logout', logoutUser);


module.exports = router;