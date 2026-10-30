const express = require('express');
const router = express.Router();
const entryController = require('../controllers/entryController');
const { auth } = require('../middleware/auth');

// All entry routes require authentication
router.use(auth);

router.get('/', entryController.getEntries);
router.get('/:date', entryController.getEntryByDate);
router.put('/:date', entryController.saveEntry);

module.exports = router;
