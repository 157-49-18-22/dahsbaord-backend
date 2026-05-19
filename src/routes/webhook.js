const express = require("express");
const { handleIncomingWhatsApp, verifyWebhook } = require("../controllers/webhookController");

const router = express.Router();

// GET /api/webhook/whatsapp  — Meta verification
router.get("/whatsapp", verifyWebhook);

// POST /api/webhook/whatsapp  — Incoming messages
router.post("/whatsapp", handleIncomingWhatsApp);

module.exports = router;
