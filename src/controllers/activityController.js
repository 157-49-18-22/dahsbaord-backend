const ActivityLog = require("../models/ActivityLog");

// GET /api/activity
const getActivityLogs = async (req, res) => {
  try {
    const { page = 1, limit = 30, agentId, type, date } = req.query;
    const result = await ActivityLog.getPaginated(
      parseInt(page),
      parseInt(limit),
      { agentId, type, date }
    );
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// GET /api/activity/agent/:agentId
const getAgentActivity = async (req, res) => {
  try {
    const logs = await ActivityLog.getByAgent(req.params.agentId);
    res.json({ success: true, logs });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// GET /api/activity/date/:date
const getByDate = async (req, res) => {
  try {
    const logs = await ActivityLog.findAll({ where: { date: req.params.date } });
    res.json({ success: true, logs });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = { getActivityLogs, getAgentActivity, getByDate };
