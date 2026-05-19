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

      // Find all queries where status is 'in_progress', acceptedAt is not null and is older than threshold
      const expiredQueries = await Query.findAll({
        where: {
          status: 'in_progress',
          acceptedAt: {
            [Op.lt]: expiryThreshold,
            [Op.ne]: null
          }
        }
      });

      if (expiredQueries.length > 0) {
        console.log(`⏰ [Auto-Expiry] Found ${expiredQueries.length} expired active agent queries. Resolving now...`);
      }

      for (const query of expiredQueries) {
        // Resolve in database (automatically clears assignedTo & sets status to resolved)
        await Query.resolve(query.id);
        
        // Log system auto-resolution activity
        await ActivityLog.create({
          id: uuidv4(),
          agentId: "system",
          agentName: "System Scheduler",
          action: "Auto-resolved (SLA Expiry)",
          customer: query.name,
          queryId: query.id,
          details: `Query auto-closed due to ${timeoutMinutes}-minute SLA timer expiry since agent acceptance.`,
          time: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
          type: "resolved",
          date: new Date().toISOString().split("T")[0],
        });

        // Broadcast to all socket.io clients so the chat screen instantly updates
        try {
          const io = getIO();
          io.emit("query:resolved", { queryId: query.id });
          console.log(`⏰ [Auto-Expiry] Query ${query.id} (${query.name}) has been auto-resolved successfully.`);
        } catch (socketErr) {
          console.error(`❌ [Auto-Expiry] Socket broadcast failed for ${query.id}:`, socketErr.message);
        }
      }
    } catch (err) {
      console.error("❌ [Auto-Expiry] Scheduler iteration error:", err);
    }
  }, intervalMs);
};

module.exports = { startSessionExpiryScheduler };
