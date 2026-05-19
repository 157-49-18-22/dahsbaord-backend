require('dotenv').config({ path: '../../backend/.env' });
const { sequelize } = require('../../backend/src/config/db');
const Query = require('../../backend/src/models/Query');

async function resetTestNumber() {
  try {
    await sequelize.authenticate();
    const testNumber = '919625613008';
    
    await Query.update({
      status: 'open',
      assignedTo: null,
      time: new Date(),
      unread: 1
    }, {
      where: { from: testNumber }
    });
    
    console.log('Test number status reset to OPEN and unassigned.');
    process.exit(0);
  } catch (err) {
    console.error('Error resetting test number:', err);
    process.exit(1);
  }
}

resetTestNumber();
