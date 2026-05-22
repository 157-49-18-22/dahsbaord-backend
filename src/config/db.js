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
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
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
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
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
  ];

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
  } catch (error) {
    console.error('❌ Unable to connect to the MySQL database:', error);
    process.exit(1);
  }
};

module.exports = { sequelize, connectDB };
