require("dotenv").config();
const express = require("express");
const http = require("http");
const cors = require("cors");
const morgan = require("morgan");

const { initSocket } = require("./src/config/socket");
const { connectDB } = require("./src/config/db");
const { errorHandler, notFound } = require("./src/middleware/errorHandler");

// Routes
const authRoutes     = require("./src/routes/auth");
const agentRoutes    = require("./src/routes/agents");
const queryRoutes    = require("./src/routes/queries");
const messageRoutes  = require("./src/routes/messages");
const activityRoutes = require("./src/routes/activity");
const reportRoutes   = require("./src/routes/reports");
const webhookRoutes  = require("./src/routes/webhook");

const app = express();
const httpServer = http.createServer(app);
const path = require("path");

// ─── Socket.io ────────────────────────────────────────────────
initSocket(httpServer);

// ─── Middleware ────────────────────────────────────────────────
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

if (process.env.NODE_ENV !== "test") {
  app.use(morgan("dev"));
}

// ─── Health Check ─────────────────────────────────────────────
app.get("/", (req, res) => {
  res.json({
    success: true,
    name: "SevaFlow CRM Backend API",
    version: "1.0.0",
    status: "running",
    timestamp: new Date().toISOString(),
    endpoints: {
      auth:     "/api/auth",
      agents:   "/api/agents",
      queries:  "/api/queries",
      messages: "/api/messages",
      activity: "/api/activity",
      reports:  "/api/reports",
      webhook:  "/api/webhook",
    },
  });
});

app.get("/api/health", (req, res) => {
  res.json({ success: true, status: "healthy", uptime: process.uptime() });
});

// ─── API Routes ────────────────────────────────────────────────
app.use("/api/auth",     authRoutes);
app.use("/api/agents",   agentRoutes);
app.use("/api/queries",  queryRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/activity", activityRoutes);
app.use("/api/reports",  reportRoutes);
app.use("/api/webhook",  webhookRoutes);

// ─── Error Handlers ────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ─── Start Server ──────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
const { startSessionExpiryScheduler } = require("./src/services/sessionExpiryScheduler");

const startServer = async () => {
  await connectDB();
  
  // Start the background session auto-expiry SLA scheduler
  startSessionExpiryScheduler();

  httpServer.listen(PORT, () => {
    console.log("\n╔══════════════════════════════════════════╗");
    console.log(`║  SevaFlow CRM Backend                    ║`);
    console.log(`║  🚀 Server running on port ${PORT}           ║`);
    console.log(`║  📡 Socket.io ready                      ║`);
    console.log(`║  🌍 http://localhost:${PORT}               ║`);
    console.log("╚══════════════════════════════════════════╝\n");
  });
};

startServer();

module.exports = { app, httpServer };
