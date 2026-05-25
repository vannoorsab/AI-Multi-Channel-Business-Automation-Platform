const Notification = require('../models/Notification');

// @desc    Get user notifications for active business
// @route   GET /api/notifications?businessId=... OR ?workspaceId=...
// @access  Private
exports.getNotifications = async (req, res) => {
  try {
    // Accept both businessId and workspaceId
    const businessId = req.query.businessId || req.query.workspaceId;

    if (!businessId) {
      return res.status(400).json({ success: false, error: 'Business ID is required' });
    }

    const notifications = await Notification.find({
      recipient: req.user.id,
      business: businessId,
    }).sort({ createdAt: -1 });

    res.json({ success: true, notifications });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Mark a specific notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
exports.markNotificationRead = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({ success: false, error: 'Notification not found' });
    }

    // Secure ownership
    if (notification.recipient.toString() !== req.user.id) {
      return res.status(450).json({ success: false, error: 'Not authorized to modify this alert' });
    }

    notification.read = true;
    await notification.save();

    res.json({ success: true, notification });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Mark all user alerts as read
// @route   PUT /api/notifications/read-all?businessId=... OR ?workspaceId=...
// @access  Private
exports.markAllNotificationsRead = async (req, res) => {
  try {
    // Accept both businessId and workspaceId
    const businessId = req.query.businessId || req.query.workspaceId;

    if (!businessId) {
      return res.status(400).json({ success: false, error: 'Business ID is required' });
    }

    await Notification.updateMany(
      { recipient: req.user.id, business: businessId, read: false },
      { $set: { read: true } }
    );

    res.json({ success: true, message: 'All notifications flagged read.' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
