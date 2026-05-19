require('dotenv').config({ path: 'c:/Users/lenovo/Desktop/dashbaoird/backend/.env' });
const { sequelize } = require('../src/config/db');
const Message = require('../src/models/Message');

async function check() {
  try {
    await sequelize.authenticate();
    console.log('Database connected.');
    
    const messages = await Message.findAll({
      order: [['createdAt', 'ASC']]
    });
    
    console.log(`Total messages in DB: ${messages.length}`);
    messages.forEach(m => {
      console.log(`ID: ${m.id} | QueryId: ${m.queryId} | Sender: ${m.sender} | Text: "${m.text}" | CreatedAt: ${m.createdAt}`);
    });
    
  } catch (err) {
    console.error('Error:', err);
  } finally {
    process.exit(0);
  }
}

check();
