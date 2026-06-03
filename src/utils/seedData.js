const bcrypt = require("bcryptjs");
const { v4: uuidv4 } = require("uuid");
const { connectDB, sequelize } = require("../config/db");

const Agent = require("../models/Agent");
const Query = require("../models/Query");
const Message = require("../models/Message");
const ActivityLog = require("../models/ActivityLog");

const seed = async () => {
  try {
    console.log("🌱 Seeding MySQL Database...");
    
    // Connect and Sync
    await connectDB();
    
    // Force sync to clear tables
    await sequelize.sync({ force: true });
    console.log("✅ Tables recreated");

    // --- Agents ---
    const agentsRaw = [
      { name: "Sneha Singh",  email: "sneha@company.com",  role: "Senior Agent",  status: "online",  avatar: "SS" },
      { name: "Amit Kumar",   email: "amit@company.com",   role: "Support Agent", status: "online",  avatar: "AK" },
      { name: "Rohan Joshi",  email: "rohan@company.com",  role: "Support Agent", status: "busy",    avatar: "RJ" },
      { name: "Kavya Reddy",  email: "kavya@company.com",  role: "Junior Agent",  status: "away",    avatar: "KR" },
      { name: "Admin User",   email: "admin@company.com",  role: "Superadmin",    status: "online",  avatar: "AU" },
    ];

    const agents = [];
    for (const a of agentsRaw) {
      const hashedPw = await bcrypt.hash("password123", 10);
      const agent = await Agent.create({
        ...a,
        password: hashedPw,
        resolvedToday: Math.floor(Math.random() * 15),
        totalMessages: Math.floor(Math.random() * 60),
        avgResponseTime: `${(Math.random() * 5 + 1).toFixed(1)} min`,
        activeChats: Math.floor(Math.random() * 4),
      });
      agents.push(agent);
    }
    console.log(`✅ ${agents.length} agents seeded`);

    const [sneha, amit, rohan, kavya, admin] = agents;

    // --- Queries & Messages ---
    const queriesRaw = [];

    const baseTime = new Date("2026-04-15T18:00:00");

    for (let i = 0; i < queriesRaw.length; i++) {
      const q = queriesRaw[i];
      const qTime = new Date(baseTime.getTime() - i * 20 * 60 * 1000);
      
      const query = await Query.create({
        from: q.from,
        name: q.name,
        avatar: q.avatar,
        message: q.message,
        time: qTime,
        status: q.status,
        assignedTo: q.assignedTo,
        unread: q.unread,
        priority: q.priority,
        createdAt: qTime,
      });

      // Seed messages
      for (let j = 0; j < q.messages.length; j++) {
        const m = q.messages[j];
        const mTime = new Date(qTime.getTime() + j * 5 * 60 * 1000);
        await Message.create({
          queryId: query.id,
          sender: m.sender,
          text: m.text,
          time: mTime.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
          agentId: m.agentId || null,
          agentName: m.agentName || null,
          read: true,
          createdAt: mTime,
        });
      }
    }
    console.log(`✅ ${queriesRaw.length} queries + messages seeded`);

    // --- Activity Logs ---
    const today = new Date().toISOString().split("T")[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

    const logsRaw = [];

    for (const log of logsRaw) {
      const logTime = new Date(`${log.date}T${log.time}:00`);
      await ActivityLog.create({
        ...log,
        details: "",
        createdAt: logTime,
      });
    }
    console.log(`✅ ${logsRaw.length} activity logs seeded`);

    console.log("\n🎉 MySQL Database seeded successfully!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Seeding failed:", err);
    process.exit(1);
  }
};

seed();
