const express = require('express');
const router = express.Router();
const grievanceController = require('../controllers/grievanceController');

// List complaints with query filters (?status=...&department=...&search=...)
router.get('/', grievanceController.getAll);

// Track complaint by token (SMC-2026-XXXX) or mobile number
router.get('/track/:query', grievanceController.track);

// Get single complaint by internal ID
router.get('/:id', grievanceController.getById);

// Citizen lodges a new grievance
router.post('/', grievanceController.create);

// Officer updates status, assigns personnel, logs remarks
router.patch('/:id/status', grievanceController.updateStatus);

// Citizen submits feedback on resolved complaint
router.post('/:id/feedback', grievanceController.submitFeedback);

module.exports = router;
