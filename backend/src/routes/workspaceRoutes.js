const express = require('express');
const router = express.Router();
const {
  getWorkspaces,
  createWorkspace,
  updateWorkspaceSettings,
  switchActiveWorkspace,
} = require('../controllers/workspaceController');
const { protect } = require('../middleware/auth');

router.use(protect); // Secure all workspace endpoints

router.route('/')
  .get(getWorkspaces)
  .post(createWorkspace);

router.post('/switch/:id', switchActiveWorkspace);
router.put('/:id/settings', updateWorkspaceSettings);

module.exports = router;
