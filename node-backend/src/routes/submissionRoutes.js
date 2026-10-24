const express = require('express');
const router = express.Router();
const submissionController = require('../controllers/submissionController');

router.post('/submit', submissionController.submitAudit);
router.get('/all', submissionController.getAllSubmissions);
router.patch('/:id/status', submissionController.updateStatus);

module.exports = router;