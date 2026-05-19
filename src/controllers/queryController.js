const { v4: uuidv4 } = require("uuid");
const Query = require("../models/Query");
const Message = require("../models/Message");
const ActivityLog = require("../models/ActivityLog");
const { getIO } = require("../config/socket");
const { Op } = require("sequelize");

const maskNumber = (number) => {
  if (!number) return '********';
  const str = String(number);
  return '******' + str.slice(-4);
};

const logActivity = async (agentId, agentName, action, customer, queryId, type, details = "") => {
  const now = new Date();
  await ActivityLog.create({
    id: uuidv4(),
    agentId,
    agentName,
    action,
    customer,
    queryId,
    details,
    time: now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
    type,
    date: now.toISOString().split("T")[0],
  });
};

// GET /api/queries
const getQueries = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, assignedTo, priority, search } = req.query;
    const result = await Query.getPaginated(
      parseInt(page),
      parseInt(limit),
      { status, assignedTo, priority, search }
    );

    const isAdmin = req.agent && req.agent.role && req.agent.role.toLowerCase().includes("admin");
    
    if (!isAdmin) {
      result.data = result.data.map(q => {
        const query = q.toJSON();
        query.from = maskNumber(query.from);
        return query;
      });
    }

    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// GET /api/queries/:id
const getQueryById = async (req, res) => {
  try {
    const queryObj = await Query.getById(req.params.id);
    if (!queryObj) return res.status(404).json({ success: false, message: "Query not found" });
    
    // Attach messages
    const messages = await Message.getByQueryId(queryObj.id);
    const query = queryObj.toJSON();
    
    const isAdmin = req.agent && req.agent.role && req.agent.role.toLowerCase().includes("admin");
    if (!isAdmin) {
      query.from = maskNumber(query.from);
    }

    res.json({ success: true, query: { ...query, messages } });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// POST /api/queries
const createQuery = async (req, res) => {
  try {
    const { from, name, message, priority = "medium" } = req.body;
    const initials = (name || "CX").split(" ").map((n) => n[0]).join("").toUpperCase();
    const now = new Date();

    const created = await Query.create({
      from,
      name: name || "Unknown",
      avatar: initials,
      message,
      time: now,
      status: "open",
      assignedTo: null,
      unread: 1,
      priority,
    });

    // Create initial message
    const msg = await Message.create({
      queryId: created.id,
      sender: "customer",
      text: message,
      time: now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
      agentId: null,
      agentName: null,
      read: false,
    });

    try {
      getIO().emit("query:new", { ...created.toJSON(), messages: [msg] });
    } catch {}

    res.status(201).json({ success: true, message: "Query created", query: created });
  } catch (err) {
    console.error("Create query error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// PATCH /api/queries/:id/assign
const assignQuery = async (req, res) => {
  try {
    const { id } = req.params;
    const agentId = req.body.agentId || req.agent.id;
    const agentName = req.agent.name;

    const query = await Query.getById(id);
    if (!query) return res.status(404).json({ success: false, message: "Query not found" });

    await Query.assign(id, agentId);
    const updatedQuery = await Query.getById(id);
    
    await logActivity(req.agent.id, agentName, "Assigned to self", query.name, id, "assigned");

    try { getIO().emit("query:assigned", { queryId: id, agentId, acceptedAt: updatedQuery.acceptedAt }); } catch {}

    res.json({ success: true, message: "Query assigned", query: updatedQuery });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// PATCH /api/queries/:id/resolve
const resolveQuery = async (req, res) => {
  try {
    const { id } = req.params;
    const query = await Query.getById(id);
    if (!query) return res.status(404).json({ success: false, message: "Query not found" });

    await Query.resolve(id);
    const updatedQuery = await Query.getById(id);
    
    await logActivity(req.agent.id, req.agent.name, "Resolved the query", query.name, id, "resolved");

    try { getIO().emit("query:resolved", { queryId: id }); } catch {}

    res.json({ success: true, message: "Query resolved", query: updatedQuery });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// PATCH /api/queries/:id/read
const markRead = async (req, res) => {
  try {
    const result = await Query.markRead(req.params.id);
    if (!result[0]) return res.status(404).json({ success: false, message: "Query not found" });
    res.json({ success: true, message: "Marked as read" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// DELETE /api/queries/:id
const deleteQuery = async (req, res) => {
  try {
    const query = await Query.getById(req.params.id);
    if (!query) return res.status(404).json({ success: false, message: "Query not found" });
    
    await query.destroy();
    await Message.destroy({ where: { queryId: req.params.id }});
    
    try { getIO().emit("query:deleted", { queryId: req.params.id }); } catch {}
    res.json({ success: true, message: "Query deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// GET /api/queries/stats/summary
const getQueryStats = async (req, res) => {
  try {
    const stats = {
      total: await Query.count(),
      open: await Query.countByStatus("open"),
      inProgress: await Query.countByStatus("in_progress"),
      resolved: await Query.countByStatus("resolved"),
      unread: await Query.countUnread(),
    };
    res.json({ success: true, stats });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = {
  getQueries,
  getQueryById,
  createQuery,
  assignQuery,
  resolveQuery,
  markRead,
  deleteQuery,
  getQueryStats,
};
