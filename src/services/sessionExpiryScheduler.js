const { Op } = require("sequelize");
const Query = require("../models/Query");
const ActivityLog = require("../models/ActivityLog");
const { getIO } = require("../config/socket");
const { v4: uuidv4 } = require("uuid");

const startSessionExpiryScheduler = () => {
  // Run query check interval every 30 seconds
  const intervalMs = 30000;
  
  // Timeout in minutes (Configurable via environment variable, fallback to 30)
  const timeoutMinutes = parseInt(process.env.QUERY_TIMEOUT_MINUTES || "30");

  console.log(`⏰ [Auto-Expiry] Scheduler initialized. Checking active queries every ${intervalMs / 1000}s. Expiry SLA: ${timeoutMinutes} minutes.`);

  setInterval(async () => {
    try {
      const now = new Date();
      const expiryThreshold = new Date(now.getTime() - timeoutMinutes * 60 * 1000);

      // User request: "jo bhi in proegress chat hong vo query pool mnhi a aksti"
      // DO NOT auto-resolve in_progress chats anymore. They stay parked with the agent.
      // We process expired logic in webhook when they reply.
      
      const expiredQueries = []; // Disabled auto-resolve SLA
    } catch (err) {
      console.error("❌ [Auto-Expiry] Scheduler iteration error:", err);
    }
  }, intervalMs);
};

module.exports = { startSessionExpiryScheduler };
