const Workspace = require('../models/Workspace');
const Business = require('../models/Business');
const User = require('../models/User');

// @desc    Get all workspaces for the logged in user
// @route   GET /api/workspaces
// @access  Private
exports.getWorkspaces = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('workspaces').populate('businesses');

    // ---- Self-Healing Migration ----
    // If the user has businesses but no workspaces (e.g., registered before this fix),
    // automatically generate matching Workspace documents using the same _id as each Business.
    if ((!user.workspaces || user.workspaces.length === 0) && user.businesses && user.businesses.length > 0) {
      console.log(`[Workspace Migration] User ${user.email} has businesses but no workspaces — auto-generating...`);
      
      const healed = [];
      for (const biz of user.businesses) {
        const bizObj = biz._id ? biz : { _id: biz, name: 'My Business', settings: {} };
        const bizId = bizObj._id;
        const bizName = bizObj.name || 'My Business';

        // Check if workspace already exists with this id
        let ws = await Workspace.findById(bizId);
        if (!ws) {
          ws = await Workspace.create({
            _id: bizId,
            name: bizName,
            owner: user._id,
            settings: bizObj.settings || {},
          });
          console.log(`[Workspace Migration] Created workspace "${ws.name}" with _id ${ws._id}`);
        }
        healed.push(ws);
      }

      // Update user workspaces array
      user.workspaces = healed.map(ws => ws._id);
      user.activeWorkspace = healed[0]._id;
      await user.save();

      return res.json({ success: true, workspaces: healed });
    }

    res.json({ success: true, workspaces: user.workspaces || [] });
  } catch (error) {
    console.error('getWorkspaces error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Create a new workspace
// @route   POST /api/workspaces
// @access  Private
exports.createWorkspace = async (req, res) => {
  try {
    const { name, settings } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, error: 'Workspace name is required' });
    }

    // Create the Workspace first to get its _id
    const workspace = await Workspace.create({
      name,
      owner: req.user.id,
      settings: settings || {},
    });

    // Create a matching Business with IDENTICAL _id so all lead/message queries are interchangeable
    const business = await Business.create({
      _id: workspace._id,
      name,
      owner: req.user.id,
      members: [{ user: req.user.id, role: req.user.role || 'business owner' }],
      settings: settings || {},
    });

    // Add to user's lists
    const user = await User.findById(req.user.id);
    user.workspaces.push(workspace._id);
    user.businesses.push(business._id);
    
    // Set as active if they don't have one
    if (!user.activeWorkspace) {
      user.activeWorkspace = workspace._id;
    }
    if (!user.activeBusiness) {
      user.activeBusiness = business._id;
    }
    await user.save();

    res.status(201).json({ success: true, workspace });
  } catch (error) {
    console.error('createWorkspace error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Update workspace settings
// @route   PUT /api/workspaces/:id/settings
// @access  Private
exports.updateWorkspaceSettings = async (req, res) => {
  try {
    const workspace = await Workspace.findById(req.params.id);

    if (!workspace) {
      return res.status(404).json({ success: false, error: 'Workspace not found' });
    }

    // Check ownership
    if (workspace.owner.toString() !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Not authorized to modify this workspace' });
    }

    workspace.name = req.body.name || workspace.name;
    workspace.settings = { ...workspace.settings, ...req.body.settings };

    await workspace.save();

    // Sync settings to matching Business document as well (same _id)
    try {
      const business = await Business.findById(req.params.id);
      if (business) {
        business.name = workspace.name;
        business.settings = workspace.settings;
        await business.save();
      }
    } catch (syncErr) {
      console.warn('Could not sync workspace settings to business:', syncErr.message);
    }

    res.json({ success: true, workspace });
  } catch (error) {
    console.error('updateWorkspaceSettings error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Switch user's current active workspace
// @route   POST /api/workspaces/switch/:id
// @access  Private
exports.switchActiveWorkspace = async (req, res) => {
  try {
    const workspaceId = req.params.id;

    // Verify user belongs to this workspace
    const user = await User.findById(req.user.id);
    const hasAccess = user.workspaces.some(ws => ws.toString() === workspaceId);

    if (!hasAccess) {
      return res.status(403).json({ success: false, error: 'You do not have access to this workspace' });
    }

    user.activeWorkspace = workspaceId;
    user.activeBusiness = workspaceId; // Keep in sync (same IDs)
    await user.save();

    res.json({ success: true, activeWorkspace: workspaceId });
  } catch (error) {
    console.error('switchActiveWorkspace error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};
