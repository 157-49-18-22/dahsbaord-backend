const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Message = sequelize.define('Message', {
  id: {
    type: DataTypes.STRING(36),
    primaryKey: true,
    defaultValue: () => require('uuid').v4()
  },
  queryId: {
    type: DataTypes.STRING(36),
    allowNull: false
  },
  sender: {
    type: DataTypes.STRING(20),
    allowNull: false
  },
  text: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  messageType: {
    type: DataTypes.STRING(20),
    defaultValue: 'text'
  },
  fileName: {
    type: DataTypes.STRING,
    allowNull: true
  },
  time: {
    type: DataTypes.STRING
  },
  agentId: {
    type: DataTypes.STRING(36),
    allowNull: true
  },
  agentName: {
    type: DataTypes.STRING,
    allowNull: true
  },
  read: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  deleted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  timestamps: true
});

// Helper methods 
Message.getByQueryId = async (queryId) => {
  // Lazily load Query model to prevent circular dependency
  const Query = require('./Query');
  const currentQuery = await Query.findByPk(queryId);
  let queryIds = [queryId];
  
  if (currentQuery) {
    const siblingQueries = await Query.findAll({
      where: { from: currentQuery.from },
      attributes: ['id']
    });
    queryIds = siblingQueries.map(q => q.id);
  }

  return await Message.findAll({ 
    where: { queryId: queryIds },
    order: [['createdAt', 'ASC']]
  });
};

Message.getSentByAgent = async (agentId) => {
  return await Message.findAll({
    where: { sender: 'agent', agentId },
    order: [['createdAt', 'DESC']]
  });
};

Message.getAllSent = async () => {
  return await Message.findAll({
    where: { sender: 'agent' },
    order: [['createdAt', 'DESC']]
  });
};

module.exports = Message;
