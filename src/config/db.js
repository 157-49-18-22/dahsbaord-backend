const { Sequelize } = require('sequelize');
require('dotenv').config();

const dialectOptions = {};
if (process.env.DB_SSL === 'true') {
  dialectOptions.ssl = {
    rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false',
  };
}

let sequelize;
if (process.env.DATABASE_URL) {
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'mysql',
    logging: false,
    dialectOptions,
    pool: {
      max: 10,
      min: 2,
      acquire: 30000,
      idle: 60000
    }
  });
} else {
  sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASS,
    {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      dialect: 'mysql',
      logging: false,
      dialectOptions,
      pool: {
        max: 10,
        min: 2,
        acquire: 30000,
        idle: 60000
      }
    }
  );
}

const runSchemaPatches = async () => {
  const patches = [
    {
      table: "Queries",
      column: "acceptedAt",
      sql: "ALTER TABLE Queries ADD COLUMN acceptedAt DATETIME NULL",
    },
    {
      table: "Messages",
      column: "messageType",
      sql: "ALTER TABLE Messages ADD COLUMN messageType VARCHAR(20) NOT NULL DEFAULT 'text'",
    },
    {
      table: "Messages",
      column: "fileName",
      sql: "ALTER TABLE Messages ADD COLUMN fileName VARCHAR(255) NULL",
    },
    {
      table: "Messages",
      column: "replyToMessageId",
      sql: "ALTER TABLE Messages ADD COLUMN replyToMessageId VARCHAR(36) NULL",
    },
    {
      table: "Messages",
      column: "replyToText",
      sql: "ALTER TABLE Messages ADD COLUMN replyToText TEXT NULL",
    },
    {
      table: "Messages",
      column: "replyToSender",
      sql: "ALTER TABLE Messages ADD COLUMN replyToSender VARCHAR(20) NULL",
    },
    {
      table: "Messages",
      column: "replyToMessageType",
      sql: "ALTER TABLE Messages ADD COLUMN replyToMessageType VARCHAR(20) NULL",
    },
    {
      table: "Agents",
      column: "groupId",
      sql: "ALTER TABLE Agents ADD COLUMN groupId VARCHAR(36) NULL",
    },
    {
      table: "Queries",
      column: "assignedToGroup",
      sql: "ALTER TABLE Queries ADD COLUMN assignedToGroup VARCHAR(36) NULL",
    },
  ];

  // ── Speed Indexes (safe to re-run, IF NOT EXISTS guard) ──────────
  const indexes = [
    { name: "idx_messages_queryId",  sql: "CREATE INDEX idx_messages_queryId  ON Messages(queryId)" },
    { name: "idx_messages_sender",   sql: "CREATE INDEX idx_messages_sender   ON Messages(sender)" },
    { name: "idx_messages_agentId",  sql: "CREATE INDEX idx_messages_agentId  ON Messages(agentId)" },
    { name: "idx_queries_from",      sql: "CREATE INDEX idx_queries_from      ON Queries(`from`)" },
    { name: "idx_queries_status",    sql: "CREATE INDEX idx_queries_status    ON Queries(status)" },
    { name: "idx_queries_assignedTo",sql: "CREATE INDEX idx_queries_assignedTo ON Queries(assignedTo)" },
    { name: "idx_activity_agentId",  sql: "CREATE INDEX idx_activity_agentId  ON ActivityLogs(agentId)" },
    { name: "idx_activity_date",     sql: "CREATE INDEX idx_activity_date     ON ActivityLogs(date)" },
  ];

  for (const idx of indexes) {
    try {
      await sequelize.query(idx.sql);
      console.log(`✅ Index created: ${idx.name}`);
    } catch (err) {
      const msg = String(err.message || "");
      if (msg.includes("Duplicate key") || msg.includes("already exists") || msg.includes("duplicate")) {
        console.log(`ℹ️  Index already exists: ${idx.name}`);
      } else {
        console.warn(`⚠️  Index skipped (${idx.name}):`, msg);
      }
    }
  }

  for (const patch of patches) {
    try {
      await sequelize.query(patch.sql);
      console.log(`✅ Added column ${patch.table}.${patch.column}`);
    } catch (err) {
      const msg = String(err.message || "");
      if (msg.includes("Duplicate column") || msg.includes("already exists")) {
        console.log(`ℹ️ Column ${patch.table}.${patch.column} already exists`);
      } else {
        console.warn(`⚠️ Schema patch skipped (${patch.table}.${patch.column}):`, msg);
      }
    }
  }
};

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ MySQL Connection has been established successfully.');
    
    // Create missing tables only; do not ALTER existing columns (breaks MySQL UNIQUE indexes)
    await sequelize.sync();
    await runSchemaPatches();
    console.log('✅ MySQL Models synced successfully.');

    // ── Keep-Alive Ping: TiDB Free Tier sleeps after idle time ──
    // Ping every 4 minutes to keep connection warm → no cold-start delay
    setInterval(async () => {
      try {
        await sequelize.query('SELECT 1');
      } catch (_) { /* silent */ }
    }, 4 * 60 * 1000);
    console.log('✅ DB keep-alive ping started (every 4 min).');

  } catch (error) {
    console.error('❌ Unable to connect to the MySQL database:', error);
    process.exit(1);
  }
};

module.exports = { sequelize, connectDB };
