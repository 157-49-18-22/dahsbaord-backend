require('dotenv').config();
const { sequelize } = require('./src/config/db');
const Query = require('./src/models/Query');
const Message = require('./src/models/Message');

async function reAddFinal() {
  try {
    await sequelize.authenticate();
    const testNumber = '+91 96256 13008';
    
    // Delete any existing
    const existing = await Query.findAll({ where: { from: testNumber } });
    for (const q of existing) {
      await Message.destroy({ where: { queryId: q.id } });
      await q.destroy();
    }
    
    // Create Fresh - UNASSIGNED so it shows for everyone
    const newQ = await Query.create({
      from: testNumber,
      name: 'APKA TEST NUMBER',
      avatar: 'AT',
      message: 'Hello! Testing WhatsApp integration',
      status: 'open',
      assignedTo: null,  // null = show for everyone
      priority: 'high',
      time: new Date(),
      unread: 1
    });
    
    // Add an initial message
    await Message.create({
      queryId: newQ.id,
      sender: 'customer',
      text: 'Hello! Testing WhatsApp integration',
      time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      agentId: null,
      agentName: null,
      read: false
    });
    
    console.log('SUCCESS! Test number added with null assignedTo - will show for all agents.');
    console.log('Query ID:', newQ.id);
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

reAddFinal();
