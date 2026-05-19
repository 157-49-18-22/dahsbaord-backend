require('dotenv').config({ path: '../../backend/.env' });
const { sequelize } = require('../../backend/src/config/db');
const Query = require('../../backend/src/models/Query');

async function reAddFresh() {
  try {
    await sequelize.authenticate();
    const testNumber = '919625613008';
    
    // Delete any existing
    await Query.destroy({ where: { from: testNumber } });
    
    // Create Fresh
    await Query.create({
      from: testNumber,
      name: 'APKA TEST NUMBER',
      avatar: 'AT',
      message: 'Fresh start for testing!',
      status: 'open',
      priority: 'high',
      time: new Date(),
      unread: 1
    });
    
    console.log('Test number added FRESHly.');
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

reAddFresh();
