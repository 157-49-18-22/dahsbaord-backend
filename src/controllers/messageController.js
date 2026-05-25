const { v4: uuidv4 } = require("uuid");
const Message = require("../models/Message");
const Query = require("../models/Query");
const ActivityLog = require("../models/ActivityLog");
const Agent = require("../models/Agent");
const { getIO } = require("../config/socket");

const toPreviewText = (messageType, text) => {
  if (messageType === "image") return "[Image]";
  if (messageType === "document") return "[Document]";
  return text;
};

/** Public HTTPS URL required by Meta/Alponix for file_url */
const normalizePublicFileUrl = (url) => {
  if (!url) return url;
  let out = String(url).trim();
  const publicBase = process.env.PUBLIC_BASE_URL?.replace(/\/$/, "");
  if (publicBase && out.startsWith("http://")) {
    try {
      const u = new URL(out);
      out = `${publicBase}${u.pathname}`;
    } catch {
      out = out.replace(/^http:/, "https:");
    }
  } else if (out.startsWith("http://")) {
    out = out.replace(/^http:/, "https:");
  }
  return out;
};

const quoteLabelForType = (messageType, text) => {
  if (messageType === "image") return "[Image]";
  if (messageType === "document") return "[Document]";
  const t = (text || "").trim();
  if (t.length > 120) return `${t.slice(0, 120)}…`;
  return t || "[Message]";
};

const formatWhatsAppReplyCaption = (replyTo, bodyText) => {
  if (!replyTo?.replyToText && !replyTo?.replyToSender) return bodyText || "";
  const who = replyTo.replyToSender === "agent" ? "You" : "Customer";
  const quote = quoteLabelForType(replyTo.replyToMessageType, replyTo.replyToText);
  const body = (bodyText || "").trim();
  const header = `↩ Replying to ${who}:\n"${quote}"`;
  return body ? `${header}\n\n${body}` : header;
};

/** Alponix §5 — Direct Flexible Messaging (non-template image/document) */
const buildAlponixWhatsAppPayload = ({ recipient, messageType, text, attachmentUrl, fileName, replyTo }) => {
  const outboundText = formatWhatsAppReplyCaption(replyTo, text);

  if (attachmentUrl && (messageType === "image" || messageType === "document")) {
    const fileUrl = normalizePublicFileUrl(attachmentUrl);
    const payload = {
      send_to: recipient,
      file_type: messageType,
      file_url: fileUrl,
    };
    if (outboundText?.trim()) payload.message = outboundText.trim();
    if (messageType === "document" && fileName) payload.document_name = fileName;
    return payload;
  }
  return {
    send_to: recipient,
    message: outboundText || "",
  };
};

const isAlponixSuccess = (data) => {
  if (!data) return false;
  const flag = String(data.success ?? "");
  const msg = String(data.message || "").toLowerCase();
  return flag === "1" || msg.includes("dispatched successfully") || msg.includes("message sent");
};

// GET /api/queries/:queryId/messages
const getMessages = async (req, res) => {
  try {
    const messages = await Message.getByQueryId(req.params.queryId);
    res.json({ success: true, messages });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// POST /api/queries/:queryId/messages
const sendMessage = async (req, res) => {
  try {
    const { queryId } = req.params;
    const { text, messageType = "text", attachmentUrl, fileName, replyTo } = req.body;
    const agent = req.agent;

    const query = await Query.getById(queryId);
    if (!query) return res.status(404).json({ success: false, message: "Query not found" });

    // Ownership check: only the assigned agent can reply
    if (!query.assignedTo) {
      return res.status(403).json({ success: false, message: "You must accept this query before replying" });
    }
    if (query.assignedTo !== agent.id) {
      return res.status(403).json({ success: false, message: "This query is assigned to another agent" });
    }

    // --- WhatsApp API Integration (Alponix Direct Message) ---
    const axios = require("axios");
    const apiURL = process.env.WHATSAPP_API_URL;
    const apiKey = process.env.WHATSAPP_API_KEY;

    // Clean phone number: remove non-digits, add 91 if 10 digits
    let recipient = query.from.replace(/\D/g, '');
    if (recipient.length === 10) recipient = '91' + recipient;

    try {
      const payload = buildAlponixWhatsAppPayload({
        recipient,
        messageType,
        text,
        attachmentUrl,
        fileName,
        replyTo,
      });

      console.log("📤 Alponix whatsapp-message payload:", JSON.stringify(payload, null, 2));

      const apiRes = await axios.post(`${apiURL}/whatsapp-message`, payload, {
        headers: {
          "x-api-key": apiKey,
          "Content-Type": "application/json",
        },
      });

      console.log(`✅ WhatsApp sent to ${recipient}:`, apiRes.data);

      if (apiRes.data && String(apiRes.data.success) === "-1" && !isAlponixSuccess(apiRes.data)) {
        const errMsg = apiRes.data.message || "";
        if (errMsg.toLowerCase().includes("session") || errMsg.toLowerCase().includes("active")) {
          return res.status(400).json({
            success: false,
            errorType: "SESSION_EXPIRED",
            message:
              "No active session found for this number. Customer must message you first (24h window), or send an approved template.",
          });
        }
        return res.status(400).json({
          success: false,
          message: errMsg || "Failed to send WhatsApp message",
          data: apiRes.data.data,
        });
      }
    } catch (apiErr) {
      const errorData = apiErr.response?.data;
      console.error("❌ WhatsApp Direct Message API Error:", errorData || apiErr.message);
      
      const errMsg = errorData?.message || apiErr.message || "";
      if (errMsg.toLowerCase().includes("session") || errMsg.toLowerCase().includes("active")) {
        return res.status(400).json({
          success: false,
          errorType: "SESSION_EXPIRED",
          message: "No active session found for this number. Please send an approved WhatsApp Template to initiate the conversation."
        });
      }
      return res.status(400).json({
        success: false,
        message: errMsg || "Failed to send WhatsApp message"
      });
    }
    // --------------------------------------------------------

    const now = new Date();
    const storedText = attachmentUrl || text;
    const previewText = toPreviewText(messageType, storedText);
    const created = await Message.create({
      queryId,
      sender: "agent",
      text: storedText,
      messageType,
      fileName: fileName || null,
      replyToMessageId: replyTo?.messageId || null,
      replyToText: replyTo?.text || null,
      replyToSender: replyTo?.sender || null,
      replyToMessageType: replyTo?.messageType || null,
      time: now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
      agentId: agent.id,
      agentName: agent.name,
      read: false,
    });

    // Update query's last message preview
    await Query.update(
      { message: previewText, time: now, assignedTo: agent.id },
      { where: { id: queryId } }
    );

    // Log activity
    await ActivityLog.create({
      agentId: agent.id,
      agentName: agent.name,
      action: "Sent a message",
      customer: query.name,
      queryId,
      details: text,
      time: created.time,
      type: "message",
      date: now.toISOString().split("T")[0],
    });

    // Update agent stats
    const currentAgent = await Agent.findByPk(agent.id);
    if (currentAgent) {
      await currentAgent.update({
        totalMessages: (currentAgent.totalMessages || 0) + 1,
      });
    }

    // Broadcast to query room (real-time)
    try {
      getIO().to(`query:${queryId}`).emit("message:new", created);
      getIO().emit("query:updated", { queryId, lastMessage: previewText, time: now.toISOString() });
    } catch {}

    res.status(201).json({ success: true, message: "Message sent", data: created });
  } catch (err) {
    console.error("Send message error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};


// POST /api/queries/:queryId/messages/customer
const receiveCustomerMessage = async (req, res) => {
  try {
    const { queryId } = req.params;
    const { text } = req.body;

    const query = await Query.getById(queryId);
    if (!query) return res.status(404).json({ success: false, message: "Query not found" });

    const now = new Date();
    const created = await Message.create({
      queryId,
      sender: "customer",
      text,
      time: now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
      agentId: null,
      agentName: null,
      read: false,
    });

    // Update query
    await Query.updateById(queryId, {
      message: text,
      time: now,
      unread: (query.unread || 0) + 1,
    });

    try {
      getIO().to(`query:${queryId}`).emit("message:new", created);
      getIO().emit("query:newIncoming", { queryId, message: created, name: query.name });
    } catch {}

    res.status(201).json({ success: true, data: created });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const maskNumber = (number) => {
  if (!number) return '********';
  const str = String(number);
  return '******' + str.slice(-4);
};

// GET /api/messages/sent
const getSentMessages = async (req, res) => {
  try {
    const isAdmin = req.agent.role && req.agent.role.toLowerCase().includes("admin");
    const messages = await (isAdmin
      ? Message.getAllSent()
      : Message.getSentByAgent(req.agent.id));

    // Enrich with query customer names
    const queries = await Query.getAll();
    const queryMap = {};
    queries.forEach((q) => { queryMap[q.id] = q; });

    const enriched = messages.map((m) => {
      const data = m.toJSON();
      const query = queryMap[data.queryId];
      let customerPhone = query?.from || "";
      
      if (!isAdmin) {
        customerPhone = maskNumber(customerPhone);
      }

      return {
        ...data,
        customerName: query?.name || "Unknown",
        customerPhone,
      };
    });

    res.json({ success: true, messages: enriched });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// DELETE /api/queries/:queryId/messages/:messageId
const deleteMessage = async (req, res) => {
  try {
    const msg = await Message.findByPk(req.params.messageId);
    if (!msg) return res.status(404).json({ success: false, message: "Message not found" });
    
    const isAdmin = req.agent.role && req.agent.role.toLowerCase().includes("admin");
    if (!isAdmin && msg.agentId !== req.agent.id) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }
    
    await msg.update({ deleted: true, text: "This message was deleted" });
    res.json({ success: true, message: "Message deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// GET /api/messages/templates
const getWhatsAppTemplates = async (req, res) => {
  try {
    const axios = require("axios");
    const apiURL = process.env.WHATSAPP_API_URL;
    const apiKey = process.env.WHATSAPP_API_KEY;

    const apiRes = await axios.get(`${apiURL}/whatsapp-template-dropdown`, {
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json'
      }
    });

    if (apiRes.data && apiRes.data.success === "-1") {
      return res.status(400).json({ success: false, message: apiRes.data.message || "Failed to fetch templates" });
    }

    res.json({ success: true, templates: apiRes.data.data || [] });
  } catch (err) {
    console.error("Error fetching templates from Alponix:", err.response?.data || err.message);
    res.status(500).json({ success: false, message: "Failed to fetch WhatsApp templates" });
  }
};

// POST /api/messages/templates/preview
const getWhatsAppTemplatePreview = async (req, res) => {
  try {
    const { templateName } = req.body;
    if (!templateName) {
      return res.status(400).json({ success: false, message: "templateName is required" });
    }

    const axios = require("axios");
    const apiURL = process.env.WHATSAPP_API_URL;
    const apiKey = process.env.WHATSAPP_API_KEY;

    const apiRes = await axios({
      method: "GET",
      url: `${apiURL}/message-template-preview`,
      data: {
        template_name: templateName
      },
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json'
      }
    });

    if (apiRes.data && apiRes.data.success === "-1") {
      return res.status(400).json({ success: false, message: apiRes.data.message || "Failed to fetch template preview" });
    }

    res.json({ success: true, preview: apiRes.data.data || [] });
  } catch (err) {
    console.error("Error fetching template preview from Alponix:", err.response?.data || err.message);
    res.status(500).json({ success: false, message: "Failed to fetch template preview" });
  }
};

// POST /api/messages/templates/send
const sendWhatsAppTemplateMessage = async (req, res) => {
  try {
    const { queryId, templateName, variables, header } = req.body;
    const agent = req.agent;

    if (!queryId || !templateName) {
      return res.status(400).json({ success: false, message: "queryId and templateName are required" });
    }

    const query = await Query.getById(queryId);
    if (!query) return res.status(404).json({ success: false, message: "Query not found" });

    // Ownership check: only the assigned agent can reply
    if (!query.assignedTo) {
      return res.status(403).json({ success: false, message: "You must accept this query before replying" });
    }
    if (query.assignedTo !== agent.id) {
      return res.status(403).json({ success: false, message: "This query is assigned to another agent" });
    }

    const axios = require("axios");
    const apiURL = process.env.WHATSAPP_API_URL;
    const apiKey = process.env.WHATSAPP_API_KEY;

    // Clean phone number: remove non-digits, add 91 if 10 digits
    let recipient = query.from.replace(/\D/g, '');
    if (recipient.length === 10) recipient = '91' + recipient;

    // Build template sending payload
    const payload = {
      send_to: recipient,
      template_name: templateName,
      variables: variables || {}
    };

    if (header) {
      payload.header = header;
    }

    console.log("DEBUG: Sending template payload:", JSON.stringify(payload, null, 2));

    let apiRes;
    try {
      apiRes = await axios.post(`${apiURL}/message-template`, payload, {
        headers: {
          'x-api-key': apiKey,
          'Content-Type': 'application/json'
        }
      });
      console.log("✅ Alponix Template Send Response:", apiRes.data);
    } catch (apiErr) {
      console.error("❌ Alponix Template Send API Error:", apiErr.response?.data || apiErr.message);
      return res.status(400).json({
        success: false,
        message: apiErr.response?.data?.message || "Alponix template validation/sending failure."
      });
    }

    if (apiRes.data && apiRes.data.success === "-1") {
      return res.status(400).json({ success: false, message: apiRes.data.message || "Failed to send template message" });
    }

    // Success! Formulate a friendly string for message text
    // E.g., "[Sent Template: order_confirmation12]"
    const displayText = `📢 Sent Template: ${templateName}`;

    const now = new Date();
    const created = await Message.create({
      queryId,
      sender: "agent",
      text: displayText,
      time: now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
      agentId: agent.id,
      agentName: agent.name,
      read: false,
    });

    // Update query's last message preview
    await Query.update(
      { message: displayText, time: now, assignedTo: agent.id },
      { where: { id: queryId } }
    );

    // Log activity
    await ActivityLog.create({
      agentId: agent.id,
      agentName: agent.name,
      action: "Sent template",
      customer: query.name,
      queryId,
      details: `Template: ${templateName}`,
      time: created.time,
      type: "message",
      date: now.toISOString().split("T")[0],
    });

    // Update agent stats
    const currentAgent = await Agent.findByPk(agent.id);
    if (currentAgent) {
      await currentAgent.update({
        totalMessages: (currentAgent.totalMessages || 0) + 1,
      });
    }

    // Broadcast to query room (real-time)
    try {
      getIO().to(`query:${queryId}`).emit("message:new", created);
      getIO().emit("query:updated", { queryId, lastMessage: displayText, time: now.toISOString() });
    } catch {}

    res.json({ success: true, message: "Template message sent successfully!", data: created });
  } catch (err) {
    console.error("Send template error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// POST /api/messages/upload
const uploadAttachment = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }
    const publicBase = process.env.PUBLIC_BASE_URL?.replace(/\/$/, "");
    const host = publicBase || `${req.protocol}://${req.get("host")}`;
    const attachmentUrl = normalizePublicFileUrl(`${host}/uploads/${req.file.filename}`);
    return res.json({
      success: true,
      attachmentUrl,
      fileName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Failed to upload file" });
  }
};

module.exports = {
  getMessages,
  sendMessage,
  receiveCustomerMessage,
  getSentMessages,
  deleteMessage,
  getWhatsAppTemplates,
  getWhatsAppTemplatePreview,
  sendWhatsAppTemplateMessage,
  uploadAttachment,
};
