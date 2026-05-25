const express = require('express');
const router = express.Router();
const { getAnalyticsOverview } = require('../controllers/analyticsController');
const { protect } = require('../middleware/auth');

router.use(protect); // Secure all analytics routes

router.get('/', getAnalyticsOverview);

module.exports = router;
