const { Server } = require("socket.io");

let io;

const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:5173",
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);

    // Agent joins their personal room
    socket.on("agent:join", (agentId) => {
      socket.join(`agent:${agentId}`);
      console.log(`👤 Agent ${agentId} joined room`);
    });

    // Agent joins a query chat room
    socket.on("query:join", (queryId) => {
      socket.join(`query:${queryId}`);
      console.log(`💬 Joined query room: ${queryId}`);
    });

    // Agent leaves a query chat room
    socket.on("query:leave", (queryId) => {
      socket.leave(`query:${queryId}`);
    });

    // Agent typing indicator
    socket.on("agent:typing", ({ queryId, agentName }) => {
      socket.to(`query:${queryId}`).emit("agent:typing", { agentName });
    });

    socket.on("agent:stopTyping", ({ queryId }) => {
      socket.to(`query:${queryId}`).emit("agent:stopTyping");
    });

    socket.on("disconnect", () => {
      console.log(`🔌 Client disconnected: ${socket.id}`);
    });
  });

  return io;
};

const getIO = () => {
  if (!io) throw new Error("Socket.io not initialized!");
  return io;
};

module.exports = { initSocket, getIO };
