require('dotenv').config();
const { sequelize } = require('./src/config/db');
const Query = require('./src/models/Query');

async function listAll() {
  try {
    await sequelize.authenticate();
    const queries = await Query.findAll();
    console.log('--- DATABASE CONTENT ---');
    queries.forEach(q => {
      console.log(`ID: ${q.id} | Name: ${q.name} | From: ${q.from} | Status: ${q.status}`);
    });
    console.log('------------------------');
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

listAll();
