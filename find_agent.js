require('dotenv').config();
const { sequelize } = require('./src/config/db');
const Agent = require('./src/models/Agent');

async function findAgent() {
  try {
    await sequelize.authenticate();
    const agents = await Agent.findAll();
    agents.forEach(a => {
      console.log(`Agent: ${a.name} | ID: ${a.id}`);
    });
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

findAgent();
