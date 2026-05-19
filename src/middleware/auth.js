const jwt = require("jsonwebtoken");
const Agent = require("../models/Agent");

/**
 * Protect routes — verify JWT token
 */
const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ success: false, message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const agent = await Agent.getById(decoded.id);
    if (!agent) {
      return res.status(401).json({ success: false, message: "Agent not found" });
    }

    req.agent = { ...agent, role: decoded.role };
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ success: false, message: "Token expired" });
    }
    return res.status(401).json({ success: false, message: "Invalid token" });
  }
};

/**
 * Admin only middleware
 */
const adminOnly = (req, res, next) => {
  if (
    !req.agent.role ||
    (!req.agent.role.toLowerCase().includes("admin") &&
     !req.agent.role.toLowerCase().includes("senior"))
  ) {
    return res.status(403).json({ success: false, message: "Admin or Senior access required" });
  }
  next();
};

/**
 * Optional auth — attach agent if token present, else continue
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.agent = await Agent.getById(decoded.id);
    }
  } catch {}
  next();
};

module.exports = { protect, adminOnly, optionalAuth };
