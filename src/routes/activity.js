const express = require("express");
const { getActivityLogs, getAgentActivity, getByDate } = require("../controllers/activityController");
const { protect } = require("../middleware/auth");

const router = express.Router();

router.use(protect);

// GET /api/activity
router.get("/", getActivityLogs);

// GET /api/activity/agent/:agentId
router.get("/agent/:agentId", getAgentActivity);

// GET /api/activity/date/:date
router.get("/date/:date", getByDate);

module.exports = router;
