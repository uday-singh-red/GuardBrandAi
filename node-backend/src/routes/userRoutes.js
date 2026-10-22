const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

router.post('/audit-blog', userController.auditUserBlog);

module.exports = router;