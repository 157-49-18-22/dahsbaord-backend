
# SevaFlow CRM — Backend API

## 🚀 Quick Start

```bash
# 1. Install dependencies
cd backend
npm install

# 2. Seed the database
npm run seed

# 3. Start the server
npm start

# 4. Dev mode (with auto-restart)
npm run dev
```

Server runs on **http://localhost:5000**

---

## 📁 Folder Structure

```
backend/
├── server.js                  ← Entry point (Express + Socket.io)
├── .env                       ← Environment variables
├── data/                      ← JSON database files (auto-created)
│   ├── agents.json
│   ├── queries.json
│   ├── messages.json
│   └── activityLogs.json
└── src/
    ├── config/
    │   ├── db.js              ← JSON file database engine
    │   └── socket.js          ← Socket.io setup & events
    ├── models/
    │   ├── Agent.js
    │   ├── Query.js
    │   ├── Message.js
    │   └── ActivityLog.js
    ├── controllers/
    │   ├── authController.js
    │   ├── agentController.js
    │   ├── queryController.js
    │   ├── messageController.js
    │   ├── activityController.js
    │   ├── reportController.js
    │   └── webhookController.js
    ├── routes/
    │   ├── auth.js
    │   ├── agents.js
    │   ├── queries.js
    │   ├── messages.js
    │   ├── activity.js
    │   ├── reports.js
    │   └── webhook.js
    ├── middleware/
    │   ├── auth.js            ← JWT protect, adminOnly
    │   ├── errorHandler.js
    │   └── validate.js
    └── utils/
        └── seedData.js        ← Database seeder
```

---

## 🔑 Auth Credentials (after seeding)

| Email | Password | Role |
|-------|----------|------|
| admin@company.com | password123 | Superadmin |
| sneha@company.com | password123 | Senior Agent |
| amit@company.com | password123 | Support Agent |
| rohan@company.com | password123 | Support Agent |
| kavya@company.com | password123 | Junior Agent |

---

## 📡 API Endpoints

### Auth
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/auth/login` | Login → returns JWT token |
| POST | `/api/auth/logout` | Logout (protected) |
| GET | `/api/auth/me` | Get current user |
| POST | `/api/auth/refresh` | Refresh JWT token |

### Queries
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/queries` | List all (paginated, filterable) |
| GET | `/api/queries/:id` | Get single query + messages |
| POST | `/api/queries` | Create query |
| PATCH | `/api/queries/:id/assign` | Assign to agent |
| PATCH | `/api/queries/:id/resolve` | Resolve query |
| PATCH | `/api/queries/:id/read` | Mark as read |
| DELETE | `/api/queries/:id` | Delete (admin only) |
| GET | `/api/queries/stats/summary` | Open/resolved counts |

### Messages
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/queries/:id/messages` | Get chat messages |
| POST | `/api/queries/:id/messages` | Agent sends message |
| POST | `/api/queries/:id/messages/customer` | Simulate incoming message |
| GET | `/api/messages/sent` | All sent messages |

### Agents
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/agents` | List all agents |
| GET | `/api/agents/:id` | Agent details |
| POST | `/api/agents` | Create agent (admin) |
| PUT | `/api/agents/:id` | Update agent |
| PATCH | `/api/agents/:id/status` | Update online status |
| DELETE | `/api/agents/:id` | Delete (admin only) |

### Reports
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/reports/overview` | Dashboard summary stats |
| GET | `/api/reports/agents` | Per-agent performance |
| GET | `/api/reports/timeline?days=7` | Activity over N days |
| GET | `/api/reports/priority` | High/medium/low breakdown |

### Activity & Webhook
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/activity` | Paginated activity logs |
| GET | `/api/activity/agent/:id` | Agent-specific logs |
| GET | `/api/webhook/whatsapp` | Meta webhook verification |
| POST | `/api/webhook/whatsapp` | Incoming WhatsApp messages |

---

## ⚡ Socket.io Events

### Client → Server
| Event | Payload | Description |
|-------|---------|-------------|
| `agent:join` | agentId | Join personal room |
| `query:join` | queryId | Join chat room |
| `query:leave` | queryId | Leave chat room |
| `agent:typing` | {queryId, agentName} | Typing indicator |
| `agent:stopTyping` | {queryId} | Stop typing |

### Server → Client
| Event | Payload | Description |
|-------|---------|-------------|
| `query:new` | query object | New incoming query |
| `query:newIncoming` | {queryId, message} | New customer message |
| `query:assigned` | {queryId, agentId} | Query assigned |
| `query:resolved` | {queryId} | Query resolved |
| `message:new` | message object | New chat message |
| `agent:statusChanged` | {agentId, status} | Agent status update |
| `agent:typing` | {agentName} | Agent is typing |

---

## 🔧 Environment Variables (.env)

```env
PORT=5000
NODE_ENV=development
JWT_SECRET=your_secret_here
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:5173
WHATSAPP_API_URL=https://graph.facebook.com/v18.0
WHATSAPP_TOKEN=your_token
WHATSAPP_PHONE_ID=your_phone_id
WHATSAPP_VERIFY_TOKEN=your_verify_token
```
