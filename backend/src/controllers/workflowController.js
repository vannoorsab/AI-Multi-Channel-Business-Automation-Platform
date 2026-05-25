const Workflow = require('../models/Workflow');

// @desc    Get all workflows for a business
// @route   GET /api/workflows?businessId=... OR ?workspaceId=...
// @access  Private
exports.getWorkflows = async (req, res) => {
  try {
    // Accept both businessId and workspaceId
    const businessId = req.query.businessId || req.query.workspaceId;

    if (!businessId) {
      return res.status(400).json({ success: false, error: 'Business ID is required' });
    }

    const workflows = await Workflow.find({ business: businessId }).sort({ createdAt: -1 });
    res.json({ success: true, workflows });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Create a new workflow automation (Owners / Admins only)
// @route   POST /api/workflows
// @access  Private
exports.createWorkflow = async (req, res) => {
  try {
    const { name, description, trigger, actions, active } = req.body;
    // Accept both businessId and workspaceId
    const businessId = req.body.businessId || req.body.workspaceId;

    if (!name || !trigger || !actions || !businessId) {
      return res.status(400).json({ success: false, error: 'Name, trigger, actions, and businessId are required' });
    }

    const workflow = await Workflow.create({
      name,
      description: description || '',
      trigger,
      actions,
      business: businessId,
      active: active !== undefined ? active : true,
    });

    res.status(201).json({ success: true, workflow });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Update a workflow rule
// @route   PUT /api/workflows/:id
// @access  Private
exports.updateWorkflow = async (req, res) => {
  try {
    let workflow = await Workflow.findById(req.params.id);

    if (!workflow) {
      return res.status(404).json({ success: false, error: 'Workflow not found' });
    }

    workflow = await Workflow.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.json({ success: true, workflow });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Delete a workflow automation rule
// @route   DELETE /api/workflows/:id
// @access  Private
exports.deleteWorkflow = async (req, res) => {
  try {
    const workflow = await Workflow.findById(req.params.id);

    if (!workflow) {
      return res.status(404).json({ success: false, error: 'Workflow not found' });
    }

    await workflow.deleteOne();
    res.json({ success: true, data: {} });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
