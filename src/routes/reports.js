const express = require("express");
const { getOverview, getAgentPerformance, getTimeline, getPriorityBreakdown } = require("../controllers/reportController");
const { protect } = require("../middleware/auth");

const router = express.Router();

router.use(protect);

// GET /api/reports/overview
router.get("/overview", getOverview);

// GET /api/reports/agents
router.get("/agents", getAgentPerformance);

// GET /api/reports/timeline?days=7
router.get("/timeline", getTimeline);

// GET /api/reports/priority
router.get("/priority", getPriorityBreakdown);

module.exports = router;
