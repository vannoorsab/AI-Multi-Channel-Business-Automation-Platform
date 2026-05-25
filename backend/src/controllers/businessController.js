const Business = require('../models/Business');
const User = require('../models/User');

// @desc    Get all businesses connected to the user
// @route   GET /api/businesses
// @access  Private
exports.getBusinesses = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('businesses');
    res.json({ success: true, businesses: user.businesses });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Create a new business tenant
// @route   POST /api/businesses
// @access  Private (Owners/Admins only)
exports.createBusiness = async (req, res) => {
  try {
    const { name, settings } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, error: 'Business name is required' });
    }

    const business = await Business.create({
      name,
      owner: req.user.id,
      members: [{ user: req.user.id, role: req.user.role }],
      settings: settings || {},
    });

    const user = await User.findById(req.user.id);
    user.businesses.push(business._id);
    
    if (!user.activeBusiness) {
      user.activeBusiness = business._id;
    }
    await user.save();

    res.status(201).json({ success: true, business });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Update business settings
// @route   PUT /api/businesses/:id/settings
// @access  Private (Owners/Admins only)
exports.updateBusinessSettings = async (req, res) => {
  try {
    const business = await Business.findById(req.params.id);

    if (!business) {
      return res.status(404).json({ success: false, error: 'Business not found' });
    }

    // RBAC Ownership Check
    const isOwner = business.owner.toString() === req.user.id;
    const isAdmin = req.user.role === 'admin';
    const isManager = business.members.some(
      m => m.user.toString() === req.user.id && ['business owner', 'admin'].includes(m.role)
    );

    if (!isOwner && !isAdmin && !isManager) {
      return res.status(403).json({ success: false, error: 'Access Denied: Only business owners can update settings.' });
    }

    business.name = req.body.name || business.name;
    business.settings = { ...business.settings, ...req.body.settings };

    await business.save();

    res.json({ success: true, business });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Switch user's current active business context
// @route   POST /api/businesses/switch/:id
// @access  Private
exports.switchActiveBusiness = async (req, res) => {
  try {
    const businessId = req.params.id;

    const user = await User.findById(req.user.id);
    const hasAccess = user.businesses.some(b => b.toString() === businessId);

    if (!hasAccess && user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Access Denied: You do not belong to this business' });
    }

    user.activeBusiness = businessId;
    await user.save();

    res.json({ success: true, activeBusiness: businessId });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
