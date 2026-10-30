const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { auth, authLimit } = require('../middleware/auth');

router.post('/signup', authLimit, authController.signup);
router.post('/login', authLimit, authController.login);
router.post('/logout', authController.logout);
router.get('/me', auth, authController.getMe);

module.exports = router;
