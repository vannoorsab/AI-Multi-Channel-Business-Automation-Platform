const express = require('express');
const router = express.Router();
const {
  getWorkflows,
  createWorkflow,
  updateWorkflow,
  deleteWorkflow,
} = require('../controllers/workflowController');
const { protect } = require('../middleware/auth');

router.use(protect); // Secure all workflow routes

router.route('/')
  .get(getWorkflows)
  .post(createWorkflow);

router.route('/:id')
  .put(updateWorkflow)
  .delete(deleteWorkflow);

module.exports = router;
