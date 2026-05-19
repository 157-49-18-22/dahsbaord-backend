const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { sequelize } = require('../src/config/db');
const Query = require('../src/models/Query');

async function addClientNumber() {
  try {
    await sequelize.authenticate();
    console.log('Database connected.');

    const clientNumber = '919220438999';
    const name = 'Client Test Number';
    
    // Check if exists
    let query = await Query.findOne({ where: { from: clientNumber } });
    
    if (!query) {
      query = await Query.create({
        from: clientNumber,
        name: name,
        avatar: 'CT',
        message: 'Hello, this is client test number!',
        status: 'open',
        priority: 'high',
        time: new Date()
      });
      console.log('Client test number added to dashboard successfully!');
    } else {
      console.log('Client number already exists in dashboard.');
    }
    
    process.exit(0);
  } catch (err) {
    console.error('Error adding client number:', err);
    process.exit(1);
  }
}

addClientNumber();
