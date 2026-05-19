const express = require("express");
const { body } = require("express-validator");
const {
  getAgents,
  getAgentById,
  createAgent,
  updateAgent,
  updateAgentStatus,
  deleteAgent,
  getAgentStats,
} = require("../controllers/agentController");
const { protect, adminOnly } = require("../middleware/auth");
const { validate } = require("../middleware/validate");

const router = express.Router();

// All routes require authentication
router.use(protect);

// GET /api/agents  — list all agents
router.get("/", getAgents);

// GET /api/agents/stats/summary
router.get("/stats/summary", getAgentStats);

// GET /api/agents/:id
router.get("/:id", getAgentById);

// POST /api/agents  — admin only
router.post(
  "/",
  adminOnly,
  [
    body("name").notEmpty().withMessage("Name required"),
    body("email").isEmail().withMessage("Valid email required"),
    body("password").isLength({ min: 6 }).withMessage("Password min 6 chars"),
  ],
  validate,
  createAgent
);

// PUT /api/agents/:id
router.put("/:id", updateAgent);

// PATCH /api/agents/:id/status
router.patch(
  "/:id/status",
  [body("status").isIn(["online", "offline", "busy", "away"]).withMessage("Invalid status")],
  validate,
  updateAgentStatus
);

// DELETE /api/agents/:id  — admin only
router.delete("/:id", adminOnly, deleteAgent);

module.exports = router;
