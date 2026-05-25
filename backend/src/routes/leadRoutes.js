const express = require('express');
const router = express.Router();
const {
  getLeads,
  createLead,
  updateLead,
  deleteLead,
} = require('../controllers/leadController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect); // Secure all lead routes

router.route('/')
  .get(getLeads)
  .post(createLead);

router.route('/:id')
  .put(updateLead)
  .delete(authorize('admin', 'business owner'), deleteLead); // Secure delete to admin/owner roles only

module.exports = router;
