const express = require('express');
const router = express.Router();
const {
  getBusinesses,
  createBusiness,
  updateBusinessSettings,
  switchActiveBusiness,
} = require('../controllers/businessController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect); // Secure all business routes

router.route('/')
  .get(getBusinesses)
  .post(authorize('admin', 'business owner'), createBusiness);

router.post('/switch/:id', switchActiveBusiness);
router.put('/:id/settings', authorize('admin', 'business owner'), updateBusinessSettings);

module.exports = router;
