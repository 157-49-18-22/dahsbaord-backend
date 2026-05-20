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
