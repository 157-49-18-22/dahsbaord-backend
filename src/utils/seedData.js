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
    const queriesRaw = [
      {
        from: "+91 98765 43210", name: "Rahul Sharma", avatar: "RS",
        message: "Mujhe apne account ke baare mein jaankari chahiye",
        status: "open", assignedTo: null, unread: 3, priority: "high",
        messages: [
          { sender: "customer", text: "Hello, koi hai?" },
          { sender: "customer", text: "Mujhe apne account ke baare mein jaankari chahiye" },
          { sender: "customer", text: "Urgent hai please reply karo" },
        ],
      },
      {
        from: "+91 87654 32109", name: "Priya Verma", avatar: "PV",
        message: "Payment nahi hua mera, please check karo",
        status: "open", assignedTo: amit.id, unread: 1, priority: "high",
        messages: [
          { sender: "customer", text: "Hi, mera payment stuck hai" },
          { sender: "agent",    text: "Haan ji, aapka order number kya hai?", agentId: amit.id, agentName: amit.name },
          { sender: "customer", text: "Payment nahi hua mera, please check karo" },
        ],
      },
      {
        from: "+91 76543 21098", name: "Suresh Gupta", avatar: "SG",
        message: "Delivery kab tak hogi?",
        status: "resolved", assignedTo: sneha.id, unread: 0, priority: "low",
        messages: [
          { sender: "customer", text: "Delivery kab tak hogi?" },
          { sender: "agent",    text: "2-3 business days mein delivery ho jaayegi", agentId: sneha.id, agentName: sneha.name },
          { sender: "customer", text: "Thank you!" },
        ],
      },
      {
        from: "+91 65432 10987", name: "Anjali Mehta", avatar: "AM",
        message: "Refund process kaise hoga?",
        status: "open", assignedTo: null, unread: 5, priority: "medium",
        messages: [
          { sender: "customer", text: "Mujhe refund chahiye" },
          { sender: "customer", text: "Refund process kaise hoga?" },
        ],
      },
      {
        from: "+91 54321 09876", name: "Vikram Patel", avatar: "VP",
        message: "Product quality se main khush nahi hoon",
        status: "in_progress", assignedTo: rohan.id, unread: 2, priority: "medium",
        messages: [
          { sender: "customer", text: "Mera product damaged aaya" },
          { sender: "customer", text: "Product quality se main khush nahi hoon" },
          { sender: "agent",    text: "Photo bhejo please", agentId: rohan.id, agentName: rohan.name },
        ],
      },
      {
        from: "+91 43210 98765", name: "Deepak Rao", avatar: "DR",
        message: "Mujhe order cancel karna hai",
        status: "open", assignedTo: null, unread: 2, priority: "high",
        messages: [
          { sender: "customer", text: "Mujhe order cancel karna hai" },
          { sender: "customer", text: "Please jaldi karo" },
        ],
      },
    ];

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

    const logsRaw = [
      { agentId: sneha.id, agentName: sneha.name, action: "Resolved the query", customer: "Suresh Gupta", type: "resolved", date: today, time: "21:15" },
      { agentId: amit.id,  agentName: amit.name,  action: "Query assigned",     customer: "Priya Verma",  type: "assigned", date: today, time: "21:00" },
      { agentId: rohan.id, agentName: rohan.name, action: "Sent a message",     customer: "Vikram Patel", type: "message",  date: today, time: "19:50" },
      { agentId: sneha.id, agentName: sneha.name, action: "Resolved the query", customer: "Manoj Tiwari", type: "resolved", date: today, time: "19:30" },
      { agentId: amit.id,  agentName: amit.name,  action: "Sent a message",     customer: "Priya Verma",  type: "message",  date: today, time: "19:00" },
      { agentId: sneha.id, agentName: sneha.name, action: "Assigned to self",   customer: "Anita Sharma", type: "assigned", date: today, time: "18:45" },
      { agentId: kavya.id, agentName: kavya.name, action: "Sent a message",     customer: "Deepak Rao",   type: "message",  date: today, time: "18:30" },
      { agentId: rohan.id, agentName: rohan.name, action: "Resolved the query", customer: "Sonia Patel",  type: "resolved", date: today, time: "18:00" },
      { agentId: sneha.id, agentName: sneha.name, action: "Resolved the query", customer: "Manoj Tiwari", type: "resolved", date: yesterday, time: "10:30" },
      { agentId: amit.id,  agentName: amit.name,  action: "Sent a message",     customer: "Priya Verma",  type: "message",  date: yesterday, time: "11:00" },
      { agentId: sneha.id, agentName: sneha.name, action: "Sent a message",     customer: "Rahul Sharma", type: "message",  date: yesterday, time: "09:45" },
    ];

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
