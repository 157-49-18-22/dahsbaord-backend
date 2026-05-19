require('dotenv').config();
const { sequelize } = require('./src/config/db');
const Query = require('./src/models/Query');

async function assignToSneha() {
  try {
    await sequelize.authenticate();
    const snehaId = '1a62889a-3696-4768-8e3c-8ca61cabfcb8';
    const testNumber = '+91 96256 13008';
    
    await Query.update({
      assignedTo: snehaId,
      status: 'in_progress',
      unread: 5,
      time: new Date()
    }, {
      where: { from: testNumber }
    });
    
    console.log('Query assigned to Sneha Singh successfully.');
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

assignToSneha();
