const express = require('express');
const router = express.Router();
const {
  getDocuments,
  uploadDocument,
  deleteDocument,
} = require('../controllers/documentController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect); // Secure all document routes

router.route('/')
  .get(getDocuments)
  .post(authorize('admin', 'business owner'), uploadDocument);

router.route('/:id')
  .delete(authorize('admin', 'business owner'), deleteDocument);

module.exports = router;
