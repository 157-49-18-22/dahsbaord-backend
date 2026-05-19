const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");
const Agent = require("../models/Agent");
const ActivityLog = require("../models/ActivityLog");

// POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const agent = await Agent.getByEmail(email);
    if (!agent) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, agent.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    // Update status to online
    await Agent.updateStatus(agent.id, "online");

    // Log activity
    const now = new Date();
    await ActivityLog.create({
      agentId: agent.id,
      agentName: agent.name,
      action: "Logged in",
      details: "Agent logged into the system",
      time: now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
      type: "login",
      date: now.toISOString().split("T")[0],
    });

    const token = jwt.sign(
      { id: agent.id, role: agent.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
    );

    const safeAgent = agent.toJSON();
    delete safeAgent.password;

    res.json({
      success: true,
      message: "Login successful",
      token,
      agent: safeAgent,
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// POST /api/auth/logout
const logout = async (req, res) => {
  try {
    await Agent.updateStatus(req.agent.id, "offline");
    res.json({ success: true, message: "Logged out successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// GET /api/auth/me
const getMe = async (req, res) => {
  try {
    const agent = await Agent.getById(req.agent.id);
    if (!agent) return res.status(404).json({ success: false, message: "Agent not found" });
    res.json({ success: true, agent });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// POST /api/auth/refresh
const refreshToken = async (req, res) => {
  try {
    const token = jwt.sign(
      { id: req.agent.id, role: req.agent.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
    );
    res.json({ success: true, token });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = { login, logout, getMe, refreshToken };
