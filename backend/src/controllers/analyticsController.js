const Lead = require('../models/Lead');
const Message = require('../models/Message');
const mongoose = require('mongoose');

// @desc    Get analytics overview metrics
// @route   GET /api/analytics?businessId=... OR ?workspaceId=...
// @access  Private
exports.getAnalyticsOverview = async (req, res) => {
  try {
    // Accept both businessId and workspaceId
    const businessId = req.query.businessId || req.query.workspaceId;

    if (!businessId) {
      return res.status(400).json({ success: false, error: 'Business ID is required' });
    }

    const businessObjectId = new mongoose.Types.ObjectId(businessId);

    // 1. Lead Funnel Breakdown
    const funnelStages = ['new', 'contacted', 'qualified', 'proposal', 'won', 'lost'];
    const leadsByStatus = await Lead.aggregate([
      { $match: { business: businessObjectId } },
      { $group: { _id: '$status', count: { $sum: 1 }, totalValue: { $sum: '$value' } } }
    ]);

    const funnelData = funnelStages.map(stage => {
      const match = leadsByStatus.find(l => l._id === stage);
      return {
        stage,
        count: match ? match.count : 0,
        value: match ? match.totalValue : 0,
      };
    });

    // 2. Value stats (Won vs Total Pipeline Value)
    const pipelineStats = await Lead.aggregate([
      { $match: { business: businessObjectId } },
      {
        $group: {
          _id: null,
          totalValue: { $sum: '$value' },
          wonValue: {
            $sum: {
              $cond: [{ $eq: ['$status', 'won'] }, '$value', 0]
            }
          },
          leadCount: { $sum: 1 }
        }
      }
    ]);

    const totalPipelineValue = pipelineStats[0]?.totalValue || 0;
    const wonPipelineValue = pipelineStats[0]?.wonValue || 0;
    const totalLeadCount = pipelineStats[0]?.leadCount || 0;

    // 3. Message Volume & Channel Breakdown
    const channelStats = await Message.aggregate([
      { $match: { business: businessObjectId } },
      { $group: { _id: '$channel', count: { $sum: 1 } } }
    ]);

    const channels = {
      whatsapp: channelStats.find(c => c._id === 'whatsapp')?.count || 0,
      webchat: channelStats.find(c => c._id === 'webchat')?.count || 0,
    };

    // 4. AI vs Agent Automation Rate
    const senderStats = await Message.aggregate([
      { $match: { business: businessObjectId, sender: { $in: ['ai', 'agent'] } } },
      { $group: { _id: '$sender', count: { $sum: 1 } } }
    ]);

    const aiCount = senderStats.find(s => s._id === 'ai')?.count || 0;
    const agentCount = senderStats.find(s => s._id === 'agent')?.count || 0;
    const totalResponses = aiCount + agentCount;
    const aiRate = totalResponses > 0 ? Math.round((aiCount / totalResponses) * 100) : 0;

    res.json({
      success: true,
      data: {
        totalLeadCount,
        totalPipelineValue,
        wonPipelineValue,
        funnelData,
        channels,
        responseStats: {
          aiCount,
          agentCount,
          aiRate,
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
