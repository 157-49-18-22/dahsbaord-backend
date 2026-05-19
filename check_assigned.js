require('dotenv').config();
const { sequelize } = require('./src/config/db');
const Query = require('./src/models/Query');

async function checkAssignedTo() {
  try {
    await sequelize.authenticate();
    const queries = await Query.findAll();
    console.log('--- assignedTo Check ---');
    queries.forEach(q => {
      console.log(`Name: ${q.name} | assignedTo: [${q.assignedTo}] | type: ${typeof q.assignedTo}`);
    });
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

checkAssignedTo();
