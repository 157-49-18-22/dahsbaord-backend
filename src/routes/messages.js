const express = require("express");
const { 
  getSentMessages,
  getWhatsAppTemplates,
  getWhatsAppTemplatePreview,
  sendWhatsAppTemplateMessage,
  uploadAttachment
} = require("../controllers/messageController");
const { protect } = require("../middleware/auth");
const { upload } = require("../middleware/upload");

const router = express.Router();

router.use(protect);

// GET /api/messages/sent
router.get("/sent", getSentMessages);

// ── WhatsApp Templates ──
// GET /api/messages/templates — fetch meta approved template dropdown list
router.get("/templates", getWhatsAppTemplates);

// POST /api/messages/templates/preview — preview custom fields & structure of a template
router.post("/templates/preview", getWhatsAppTemplatePreview);

// POST /api/messages/templates/send — dispatch a structured template message
router.post("/templates/send", sendWhatsAppTemplateMessage);
router.post("/upload", upload.single("file"), uploadAttachment);

module.exports = router;
