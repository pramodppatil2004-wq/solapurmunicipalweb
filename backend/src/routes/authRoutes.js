const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Municipal Officer login
router.post('/login', authController.login);

// Verify active session
router.get('/verify', authController.verify);

module.exports = router;
