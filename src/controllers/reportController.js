const Query = require("../models/Query");
const Agent = require("../models/Agent");
const ActivityLog = require("../models/ActivityLog");
const Message = require("../models/Message");
const { Op } = require("sequelize");

// GET /api/reports/overview
const getOverview = async (req, res) => {
  try {
    const today = new Date().toISOString().split("T")[0];

    const totalQueries = await Query.count();
    const openQueries = await Query.countByStatus("open");
    const inProgressQueries = await Query.countByStatus("in_progress");
    const resolvedQueries = await Query.countByStatus("resolved");
    const resolvedToday = await ActivityLog.getResolvedToday(today);

    const totalAgents = await Agent.count();
    const onlineAgents = await Agent.countOnline();

    const allMessages = await Message.getAllSent();
    const messagesToday = allMessages.filter(
      (m) => m.createdAt && m.createdAt.toISOString().startsWith(today)
    ).length;

    res.json({
      success: true,
      report: {
        totalQueries,
        openQueries,
        inProgressQueries,
        resolvedQueries,
        resolvedToday,
        totalAgents,
        onlineAgents,
        messagesToday,
        totalMessagesSent: allMessages.length,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// GET /api/reports/agents
const getAgentPerformance = async (req, res) => {
  try {
    const today = req.query.date || new Date().toISOString().split("T")[0];
    const agents = await Agent.findAll();

    const report = await Promise.all(agents.map(async (agent) => {
      const resolvedToday = await ActivityLog.getResolvedTodayByAgent(agent.id, today);
      const sentMessages = await Message.getSentByAgent(agent.id);
      
      const sentToday = sentMessages.filter(
        (m) => m.createdAt && m.createdAt.toISOString().startsWith(today)
      ).length;
      
      const assignedQueries = await Query.getByAgent(agent.id);
      const resolvedTotal = assignedQueries.filter((q) => q.status === "resolved").length;

      return {
        ...agent.toJSON(),
        resolvedToday,
        sentToday,
        totalResolved: resolvedTotal,
        totalSent: sentMessages.length,
        activeChats: assignedQueries.filter((q) => q.status !== "resolved").length,
      };
    }));

    res.json({ success: true, agents: report });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// GET /api/reports/timeline?days=7
const getTimeline = async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 7;
    const timeline = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];

      const resolved = await ActivityLog.getResolvedToday(dateStr);
      const dayLogs = await ActivityLog.findAll({ where: { date: dateStr } });
      const messages = dayLogs.filter((l) => l.type === "message").length;
      const assigned = dayLogs.filter((l) => l.type === "assigned").length;

      timeline.push({
        date: dateStr,
        label: date.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" }),
        resolved,
        messages,
        assigned,
      });
    }

    res.json({ success: true, timeline });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// GET /api/reports/priority
const getPriorityBreakdown = async (req, res) => {
  try {
    const breakdown = {
      high: await Query.countByStatus("high"), // Note: using priority field but countByStatus name for logic
      medium: await Query.count({ where: { priority: 'medium' }}),
      low: await Query.count({ where: { priority: 'low' }}),
    };
    // Fix logic: previous code countByStatus was checking status field
    res.json({ 
      success: true, 
      breakdown: {
        high: await Query.count({ where: { priority: 'high' }}),
        medium: await Query.count({ where: { priority: 'medium' }}),
        low: await Query.count({ where: { priority: 'low' }}),
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = { getOverview, getAgentPerformance, getTimeline, getPriorityBreakdown };
