const { DataTypes, Op } = require('sequelize');
const { sequelize } = require('../config/db');

const Query = sequelize.define('Query', {
  id: {
    type: DataTypes.STRING(36),
    primaryKey: true,
    defaultValue: () => require('uuid').v4()
  },
  from: {
    type: DataTypes.STRING,
    allowNull: false
  },
  name: {
    type: DataTypes.STRING,
    defaultValue: 'Unknown'
  },
  avatar: {
    type: DataTypes.STRING
  },
  message: {
    type: DataTypes.TEXT
  },
  time: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  status: {
    type: DataTypes.STRING(20),
    defaultValue: 'open'
  },
  assignedTo: {
    type: DataTypes.STRING(36),
    allowNull: true
  },
  assignedToGroup: {
    type: DataTypes.STRING(36),
    allowNull: true
  },
  unread: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  priority: {
    type: DataTypes.STRING(20),
    defaultValue: 'medium'
  },
  acceptedAt: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  timestamps: true
});

// Helper methods 
Query.getAll = async () => {
  return await Query.findAll({ order: [['time', 'DESC']] });
};

Query.getById = async (id) => {
  return await Query.findByPk(id);
};

Query.getByAgent = async (agentId) => {
  return await Query.findAll({ where: { assignedTo: agentId } });
};

Query.assign = async (id, agentId) => {
  return await Query.update({ assignedTo: agentId, status: 'in_progress', unread: 0, acceptedAt: new Date() }, { where: { id } });
};

Query.resolve = async (id) => {
  return await Query.update({ status: 'resolved', unread: 0 }, { where: { id } });
};

Query.markRead = async (id) => {
  return await Query.update({ unread: 0 }, { where: { id } });
};

Query.countByStatus = async (status) => {
  return await Query.count({ where: { status } });
};

Query.countUnread = async () => {
  return await Query.count({ where: { unread: { [Op.gt]: 0 } } });
};

Query.getPaginated = async (page = 1, limit = 20, filters = {}) => {
  const where = {};
  if (filters.status && filters.status !== 'all') where.status = filters.status;
  if (filters.assignedTo) where.assignedTo = filters.assignedTo;
  if (filters.assignedToGroup) where.assignedToGroup = filters.assignedToGroup;
  if (filters.priority) where.priority = filters.priority;
  if (filters.search) {
    const searchTerm = filters.search.toLowerCase();
    where[Op.or] = [
      sequelize.where(sequelize.fn('LOWER', sequelize.col('name')), 'LIKE', `%${searchTerm}%`),
      sequelize.where(sequelize.fn('LOWER', sequelize.col('message')), 'LIKE', `%${searchTerm}%`),
      sequelize.where(sequelize.fn('LOWER', sequelize.col('from')), 'LIKE', `%${searchTerm}%`)
    ];
  }

  const { count, rows } = await Query.findAndCountAll({
    where,
    order: [['time', 'DESC']],
    limit: parseInt(limit),
    offset: (parseInt(page) - 1) * parseInt(limit)
  });

  return {
    data: rows,
    total: count,
    page: parseInt(page),
    totalPages: Math.ceil(count / limit)
  };
};

module.exports = Query;
