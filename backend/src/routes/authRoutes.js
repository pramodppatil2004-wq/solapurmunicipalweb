const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Municipal Officer login, registration & verification
router.post('/login', authController.login);
router.post('/register', authController.registerOfficer);
router.post('/admin/register', authController.registerOfficer);
router.get('/verify', authController.verify);
router.get('/admin/officers', authController.getOfficers);

// Citizen registration, login & session check
router.post('/citizen/register', authController.citizenRegister);
router.post('/citizen/login', authController.citizenLogin);
router.get('/citizen/verify', authController.citizenVerify);

module.exports = router;
