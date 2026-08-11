const { Op } = require("sequelize");
const Query = require("../models/Query");
const Message = require("../models/Message");
const Contact = require("../models/Contact");
const { getIO } = require("../config/socket");

const maskNumber = (number) => {
  if (!number) return "********";
  const str = String(number);
  return "******" + str.slice(-4);
};

const toPreviewText = (messageType, text) => {
  if (messageType === "image") return "[Image]";
  if (messageType === "document") return "[Document]";
  return text;
};

const phoneVariants = (from) => {
  const cleanFrom = String(from || "").replace(/\s+/g, "");
  let local = cleanFrom;
  if (local.startsWith("91") && local.length === 12) local = local.substring(2);
  return [...new Set([from, cleanFrom, local, `91${local}`, `+91${local}`].filter(Boolean))];
};

/**
 * POST /api/webhook/whatsapp
 */
const handleIncomingWhatsApp = async (req, res) => {
  try {
    const body = req.body;
    console.log("DEBUG: Incoming Webhook Body:", JSON.stringify(body, null, 2));

    const from = body.phone_number;
    const messageType = body.message_type || "text";
    const text = body.message || "[Media message]";
    const previewText = toPreviewText(messageType, text);
    let name = body.name || from;

    if (!from) {
      console.log("DEBUG: No phone_number found in payload, skipping.");
      return res.sendStatus(200);
    }

    const variants = phoneVariants(from);
    const local10 = variants.find((v) => String(v).replace(/\D/g, "").length === 10) ||
      String(from).replace(/\D/g, "").slice(-10);

    try {
      const match = await Contact.findOne({
        where: {
          [Op.or]: [
            { mobileNo: { [Op.in]: variants } },
            ...(local10 ? [{ mobileNo: { [Op.like]: `%${local10}` } }] : []),
          ],
        },
      });
      if (match) name = match.name;
    } catch (err) {
      console.error("Error finding contact:", err);
    }

    // Indexed lookup instead of loading every query into memory
    let query = await Query.findOne({
      where: {
        status: { [Op.ne]: "resolved" },
        [Op.or]: [
          { from: { [Op.in]: variants } },
          ...(local10 ? [{ from: { [Op.like]: `%${local10}%` } }] : []),
        ],
      },
      order: [["time", "DESC"]],
    });

    const now = new Date();

    if (!query) {
      const initials = name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase();
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
      if (query.status === "in_progress" && query.acceptedAt) {
        const diffMs = now.getTime() - new Date(query.acceptedAt).getTime();
        if (diffMs > 30 * 60 * 1000) {
          isUrgent = true;
        }
      }

      await query.update({
        name,
        message: previewText,
        time: now,
        unread: (query.unread || 0) + 1,
        ...(isUrgent && { priority: "urgent" }),
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
      queryData.from = maskNumber(queryData.from);
      const msgData = msg.toJSON();

      getIO().emit("query:newIncoming", {
        queryId: query.id,
        query: queryData,
        message: msgData,
      });
      // Global so open chats update instantly without requiring query room join
      getIO().emit("message:new", msgData);
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
