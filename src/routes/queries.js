const express = require("express");
const { body } = require("express-validator");
const {
  getQueries,
  getQueryById,
  createQuery,
  assignQuery,
  resolveQuery,
  markRead,
  deleteQuery,
  getQueryStats,
} = require("../controllers/queryController");
const { protect, adminOnly } = require("../middleware/auth");
const { validate } = require("../middleware/validate");
const { getMessages, sendMessage, receiveCustomerMessage } = require("../controllers/messageController");

const router = express.Router();

router.use(protect);

// GET /api/queries/stats/summary
router.get("/stats/summary", getQueryStats);

// GET /api/queries
router.get("/", getQueries);

// GET /api/queries/:id
router.get("/:id", getQueryById);

// POST /api/queries
router.post(
  "/",
  [
    body("from").notEmpty().withMessage("Phone number required"),
    body("message").notEmpty().withMessage("Message required"),
  ],
  validate,
  createQuery
);

// PATCH /api/queries/:id/assign
router.patch("/:id/assign", assignQuery);

// PATCH /api/queries/:id/resolve
router.patch("/:id/resolve", resolveQuery);

// PATCH /api/queries/:id/read
router.patch("/:id/read", markRead);

// PATCH /api/queries/:id/priority
router.patch("/:id/priority", async (req, res) => {
  try {
    const Query = require("../models/Query");
    const { priority } = req.body;
    const allowed = ['low', 'medium', 'high', 'urgent'];
    if (!allowed.includes(priority)) return res.status(400).json({ message: "Invalid priority" });
    await Query.update({ priority }, { where: { id: req.params.id } });
    res.json({ success: true, priority });
  } catch (err) {
    console.error("Priority update error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// DELETE /api/queries/:id  — admin only
router.delete("/:id", adminOnly, deleteQuery);

// ── Messages within a query ──
// GET /api/queries/:queryId/messages
router.get("/:queryId/messages", getMessages);

// POST /api/queries/:queryId/messages  — agent sends message
router.post(
  "/:queryId/messages",
  [
    body().custom((value) => {
      const hasText = Boolean(value?.text && String(value.text).trim());
      const hasAttachment = Boolean(value?.attachmentUrl && String(value.attachmentUrl).trim());
      if (!hasText && !hasAttachment) {
        throw new Error("Message text or attachmentUrl required");
      }
      return true;
    }),
  ],
  validate,
  sendMessage
);

// POST /api/queries/:queryId/messages/customer  — simulate incoming (dev/testing)
router.post("/:queryId/messages/customer", receiveCustomerMessage);

module.exports = router;
