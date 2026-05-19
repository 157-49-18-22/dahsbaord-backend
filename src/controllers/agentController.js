const bcrypt = require("bcryptjs");
const { v4: uuidv4 } = require("uuid");
const Agent = require("../models/Agent");
const { getIO } = require("../config/socket");

// GET /api/agents
const getAgents = async (req, res) => {
  try {
    const agents = await Agent.getAll();
    res.json({ success: true, agents });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// GET /api/agents/:id
const getAgentById = async (req, res) => {
  try {
    const agent = await Agent.getById(req.params.id);
    if (!agent) return res.status(404).json({ success: false, message: "Agent not found" });
    res.json({ success: true, agent });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// POST /api/agents
const createAgent = async (req, res) => {
  try {
    const { name, email, password, role, avatar } = req.body;

    // Check email uniqueness
    const existing = await Agent.getByEmail(email);
    if (existing) {
      return res.status(400).json({ success: false, message: "Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const initials = name.split(" ").map((n) => n[0]).join("").toUpperCase();

    const agent = await Agent.create({
      name,
      avatar: avatar || initials,
      email,
      password: hashedPassword,
      role: role || "Support Agent",
      status: "offline",
      resolvedToday: 0,
      totalMessages: 0,
      avgResponseTime: "0 min",
      activeChats: 0,
    });

    const data = agent.toJSON();
    delete data.password;

    try {
      getIO().emit("agent:created", data);
    } catch {}

    res.status(201).json({ success: true, message: "Agent created", agent: data });
  } catch (err) {
    console.error("Create agent error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// PUT /api/agents/:id
const updateAgent = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (updates.password) {
      updates.password = await bcrypt.hash(updates.password, 10);
    }

    const [affectedCount] = await Agent.update(updates, { where: { id } });
    if (affectedCount === 0) {
      // Check if agent exists even if no rows were updated
      const exists = await Agent.findByPk(id);
      if (!exists) return res.status(404).json({ success: false, message: "Agent not found" });
    }

    const updatedAgent = await Agent.findByPk(id);
    const data = updatedAgent.toJSON();
    delete data.password;
    try { getIO().emit("agent:updated", data); } catch {}

    res.json({ success: true, message: "Agent updated", agent: data });
  } catch (err) {
    console.error("Update agent error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// PATCH /api/agents/:id/status
const updateAgentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["online", "offline", "busy", "away"].includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status value" });
    }

    const result = await Agent.updateStatus(id, status);
    if (!result[0]) return res.status(404).json({ success: false, message: "Agent not found" });

    try { getIO().emit("agent:statusChanged", { agentId: id, status }); } catch {}

    res.json({ success: true, message: "Status updated", status });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// DELETE /api/agents/:id
const deleteAgent = async (req, res) => {
  try {
    const agent = await Agent.findByPk(req.params.id);
    if (!agent) return res.status(404).json({ success: false, message: "Agent not found" });

    await agent.destroy();
    try { getIO().emit("agent:deleted", { agentId: req.params.id }); } catch {}

    res.json({ success: true, message: "Agent deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// GET /api/agents/stats/summary
const getAgentStats = async (req, res) => {
  try {
    const stats = {
      total: await Agent.count(),
      online: await Agent.count({ where: { status: "online" } }),
      busy: await Agent.count({ where: { status: "busy" } }),
      offline: await Agent.count({ where: { status: "offline" } }),
      away: await Agent.count({ where: { status: "away" } }),
    };
    res.json({ success: true, stats });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = {
  getAgents,
  getAgentById,
  createAgent,
  updateAgent,
  updateAgentStatus,
  deleteAgent,
  getAgentStats,
};
