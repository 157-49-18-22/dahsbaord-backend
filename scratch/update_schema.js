require('dotenv').config({ path: 'c:/Users/lenovo/Desktop/dashbaoird/backend/.env' });
const { sequelize } = require('../src/config/db');

async function migrate() {
  try {
    await sequelize.authenticate();
    console.log('Database connected.');
    
    // Add acceptedAt column if not exists
    try {
      await sequelize.query('ALTER TABLE Queries ADD COLUMN acceptedAt DATETIME NULL;');
      console.log('✅ Column acceptedAt added successfully to Queries table!');
    } catch (queryErr) {
      if (queryErr.message.includes('duplicate column') || queryErr.message.includes('already exists')) {
        console.log('ℹ️ Column acceptedAt already exists.');
      } else {
        console.warn('⚠️ Query warning (might already exist):', queryErr.message);
      }
    }
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    process.exit(0);
  }
}

migrate();
