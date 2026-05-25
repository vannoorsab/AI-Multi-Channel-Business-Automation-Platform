const Lead = require('../models/Lead');

// @desc    Get all leads for a business
// @route   GET /api/leads?businessId=... OR ?workspaceId=...
// @access  Private
exports.getLeads = async (req, res) => {
  try {
    // Accept both businessId and workspaceId (they share the same _id after unification)
    const businessId = req.query.businessId || req.query.workspaceId;

    if (!businessId) {
      return res.status(400).json({ success: false, error: 'Business ID is required' });
    }

    const leads = await Lead.find({ business: businessId }).sort({ updatedAt: -1 });
    res.json({ success: true, leads });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Create a new lead manually
// @route   POST /api/leads
// @access  Private
exports.createLead = async (req, res) => {
  try {
    const { name, email, phone, status, value, notes } = req.body;
    // Accept both businessId and workspaceId
    const businessId = req.body.businessId || req.body.workspaceId;

    if (!name || !phone || !businessId) {
      return res.status(400).json({ success: false, error: 'Name, phone and businessId are required' });
    }

    // Check if phone already registered in this business tenant
    const existing = await Lead.findOne({ phone, business: businessId });
    if (existing) {
      return res.status(400).json({ success: false, error: 'Lead with this phone number already exists in this business' });
    }

    const lead = await Lead.create({
      name,
      email,
      phone,
      status: status || 'new',
      value: value || 0,
      business: businessId,
      notes: notes || '',
    });

    res.status(201).json({ success: true, lead });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Update a lead card details
// @route   PUT /api/leads/:id
// @access  Private
exports.updateLead = async (req, res) => {
  try {
    let lead = await Lead.findById(req.params.id);

    if (!lead) {
      return res.status(404).json({ success: false, error: 'Lead not found' });
    }

    lead = await Lead.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.json({ success: true, lead });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Delete a lead (Owners / Admins only - RBAC)
// @route   DELETE /api/leads/:id
// @access  Private
exports.deleteLead = async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id);

    if (!lead) {
      return res.status(404).json({ success: false, error: 'Lead not found' });
    }

    // Cascade delete related Messages and Conversations to keep DB clean
    const Message = require('../models/Message');
    const Conversation = require('../models/Conversation');
    
    await Message.deleteMany({ lead: lead._id });
    await Conversation.deleteMany({ lead: lead._id });

    await lead.deleteOne();
    res.json({ success: true, data: {} });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
