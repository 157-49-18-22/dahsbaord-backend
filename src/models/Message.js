const { DataTypes, Op } = require('sequelize');
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
  replyToMessageId: {
    type: DataTypes.STRING(36),
    allowNull: true
  },
  replyToText: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  replyToSender: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  replyToMessageType: {
    type: DataTypes.STRING(20),
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

const getRelatedQueryIds = async (queryId, includeSiblings) => {
  const Query = require('./Query');
  let queryIds = [queryId];

  if (includeSiblings) {
    const currentQuery = await Query.findByPk(queryId, { attributes: ['id', 'from', 'name'] });
    // Prevent forwarded tasks (Mapping: ...) from linking with the original customer's chat history
    if (currentQuery?.from && currentQuery.name && !currentQuery.name.startsWith('Mapping:')) {
      const siblingQueries = await Query.findAll({
        where: { 
          from: currentQuery.from,
          name: { [Op.notLike]: 'Mapping:%' } 
        },
        attributes: ['id'],
      });
      queryIds = siblingQueries.map((q) => q.id);
    }
  }
  return queryIds;
};

// Strict cursor pagination for heavy threads.
Message.getByQueryIdPaginated = async (
  queryId,
  { limit = 80, includeSiblings = true, beforeCreatedAt = null } = {}
) => {
  const queryIds = await getRelatedQueryIds(queryId, includeSiblings);
  const safeLimit = Math.min(Math.max(parseInt(limit, 10) || 80, 1), 300);
  const where = { queryId: queryIds };
  if (beforeCreatedAt) {
    where.createdAt = { [Op.lt]: new Date(beforeCreatedAt) };
  }

  const rows = await Message.findAll({
    where,
    order: [['createdAt', 'DESC'], ['id', 'DESC']],
    limit: safeLimit + 1,
  });

  const hasMore = rows.length > safeLimit;
  const trimmed = hasMore ? rows.slice(0, safeLimit) : rows;
  const messages = trimmed.reverse();
  const oldest = messages[0];

  return {
    messages,
    hasMore,
    nextCursor: oldest ? oldest.createdAt : null,
  };
};

// Helper methods — load recent messages only (heavy chats must stay fast)
Message.getByQueryId = async (queryId, options = {}) => {
  const { messages } = await Message.getByQueryIdPaginated(queryId, options);
  return messages;
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
