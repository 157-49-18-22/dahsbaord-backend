require('dotenv').config({ path: '../../backend/.env' });
const { sequelize } = require('../../backend/src/config/db');
const Query = require('../../backend/src/models/Query');

async function addTestNumber() {
  try {
    await sequelize.authenticate();
    console.log('Database connected.');

    const testNumber = '919625613008';
    const name = 'Test Number (Me)';
    
    // Check if exists
    let query = await Query.findOne({ where: { from: testNumber } });
    
    if (!query) {
      query = await Query.create({
        from: testNumber,
        name: name,
        avatar: 'TN',
        message: 'Hello, testing WhatsApp connection!',
        status: 'open',
        priority: 'high',
        time: new Date()
      });
      console.log('Test number added to dashboard!');
    } else {
      console.log('Number already exists in dashboard.');
    }
    
    process.exit(0);
  } catch (err) {
    console.error('Error adding test number:', err);
    process.exit(1);
  }
}

addTestNumber();
