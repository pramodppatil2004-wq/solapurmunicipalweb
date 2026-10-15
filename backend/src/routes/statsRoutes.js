const express = require('express');
const router = express.Router();
const statsController = require('../controllers/statsController');

// Municipal analytics and public feed
router.get('/', statsController.getOverview);

module.exports = router;
