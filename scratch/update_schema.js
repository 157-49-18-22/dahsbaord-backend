require('dotenv').config({ path: 'c:/Users/lenovo/Desktop/dashbaoird/backend/.env' });
const { sequelize } = require('../src/config/db');

async function migrate() {
  try {
    await sequelize.authenticate();
    console.log('Database connected.');
    
    const patches = [
      'ALTER TABLE Queries ADD COLUMN acceptedAt DATETIME NULL',
      "ALTER TABLE Messages ADD COLUMN messageType VARCHAR(20) NOT NULL DEFAULT 'text'",
      'ALTER TABLE Messages ADD COLUMN fileName VARCHAR(255) NULL',
      'ALTER TABLE Messages ADD COLUMN replyToMessageId VARCHAR(36) NULL',
      'ALTER TABLE Messages ADD COLUMN replyToText TEXT NULL',
      'ALTER TABLE Messages ADD COLUMN replyToSender VARCHAR(20) NULL',
      'ALTER TABLE Messages ADD COLUMN replyToMessageType VARCHAR(20) NULL',
    ];

    for (const sql of patches) {
      try {
        await sequelize.query(sql);
        console.log('✅ Applied:', sql);
      } catch (err) {
        const msg = String(err.message || '');
        if (msg.includes('Duplicate column') || msg.includes('already exists')) {
          console.log('ℹ️ Already exists:', sql);
        } else {
          console.warn('⚠️ Warning:', msg);
        }
      }
    }
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    process.exit(0);
  }
}

migrate();
