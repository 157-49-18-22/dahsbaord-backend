const { v4: uuidv4 } = require("uuid");
const Query = require("../models/Query");
const Message = require("../models/Message");
const Contact = require("../models/Contact");
const { getIO } = require("../config/socket");

const maskNumber = (number) => {
  if (!number) return '********';
  const str = String(number);
  return '******' + str.slice(-4);
};

const toPreviewText = (messageType, text) => {
  if (messageType === "image") return "[Image]";
  if (messageType === "document") return "[Document]";
  return text;
};

/**
 * POST /api/webhook/whatsapp
 */
const handleIncomingWhatsApp = async (req, res) => {
  try {
    const body = req.body;
    console.log("DEBUG: Incoming Webhook Body:", JSON.stringify(body, null, 2));

    // Support Alponix (WhatsAppSync) Format
    const from = body.phone_number;
    const messageType = body.message_type || "text";
    const text = body.message || "[Media message]";
    const previewText = toPreviewText(messageType, text);
    let name = body.name || from;

    if (!from) {
      console.log("DEBUG: No phone_number found in payload, skipping.");
      return res.sendStatus(200);
    }

    try {
      // Strip any whitespace from the incoming number just in case
      const cleanFrom = from.replace(/\s+/g, "");
      let searchNumber = cleanFrom;
      if (searchNumber.startsWith("91") && searchNumber.length === 12) {
        searchNumber = searchNumber.substring(2);
      }
      
      const contactList = await Contact.findAll();
      const match = contactList.find(c => {
         const cNum = c.mobileNo.replace(/\s+/g, "");
         return cNum === searchNumber || cNum === cleanFrom;
      });

      if (match) {
        name = match.name;
      }
    } catch (err) {
      console.error("Error finding contact:", err);
    }

    const allQueries = await Query.findAll();
    let query = allQueries.find((q) => q.from.replace(/\s+/g, "") === from.replace(/\s+/g, "") && q.status !== "resolved");

    const now = new Date();

    if (!query) {
      const initials = name.split(" ").map((n) => n[0]).join("").toUpperCase();
      query = await Query.create({
        from,
        name,
        avatar: initials.slice(0, 2),
        message: previewText,
        time: now,
        status: "open",
        assignedTo: null,
        unread: 1,
        priority: "medium",
      });
    } else {
      let isUrgent = false;
      if (query.status === 'in_progress' && query.acceptedAt) {
        const diffMs = now.getTime() - new Date(query.acceptedAt).getTime();
        if (diffMs > 30 * 60 * 1000) {
          isUrgent = true;
        }
      }

      await query.update({
        name, // Overwrite name to catch any Contact Book updates
        message: previewText,
        time: now,
        unread: (query.unread || 0) + 1,
        ...(isUrgent && { priority: 'urgent' })
      });
    }

    const msg = await Message.create({
      queryId: query.id,
      sender: "customer",
      text,
      messageType,
      time: now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
      agentId: null,
      agentName: null,
      read: false,
    });

    try {
      const queryData = query.toJSON();
      // Mask the number for general broadcast
      queryData.from = maskNumber(queryData.from);

      getIO().emit("query:newIncoming", {
        queryId: query.id,
        query: queryData,
        message: msg.toJSON(),
      });
      getIO().to(`query:${query.id}`).emit("message:new", msg.toJSON());
    } catch (err) {
      console.error("Socket emit error:", err);
    }

    res.status(200).send({ success: true });
  } catch (err) {
    console.error("Webhook error:", err);
    res.sendStatus(500);
  }
};

const verifyWebhook = (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  }
  res.sendStatus(403);
};

module.exports = { handleIncomingWhatsApp, verifyWebhook };
