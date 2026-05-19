const { DataTypes, Op } = require('sequelize');
const { sequelize } = require('../config/db');

const ActivityLog = sequelize.define('ActivityLog', {
  id: {
    type: DataTypes.STRING(36),
    primaryKey: true,
    defaultValue: () => require('uuid').v4()
  },
  agentId: {
    type: DataTypes.STRING(36),
    allowNull: true
  },
  agentName: {
    type: DataTypes.STRING
  },
  action: {
    type: DataTypes.STRING
  },
  customer: {
    type: DataTypes.STRING
  },
  queryId: {
    type: DataTypes.STRING(36),
    allowNull: true
  },
  details: {
    type: DataTypes.TEXT
  },
  time: {
    type: DataTypes.STRING
  },
  type: {
    type: DataTypes.STRING(20),
    allowNull: false
  },
  date: {
    type: DataTypes.DATEONLY,
    defaultValue: DataTypes.NOW
  }
}, {
  timestamps: true
});

// Helper methods 
ActivityLog.getByAgent = async (agentId) => {
  return await ActivityLog.findAll({
    where: { agentId },
    order: [['createdAt', 'DESC']]
  });
};

ActivityLog.getResolvedTodayByAgent = async (agentId, date) => {
  return await ActivityLog.count({
    where: { agentId, type: 'resolved', date }
  });
};

ActivityLog.getResolvedToday = async (date) => {
  return await ActivityLog.count({
    where: { type: 'resolved', date }
  });
};

ActivityLog.getPaginated = async (page = 1, limit = 30, filters = {}) => {
  const where = {};
  if (filters.agentId) where.agentId = filters.agentId;
  if (filters.type) where.type = filters.type;
  if (filters.date) where.date = filters.date;

  const { count, rows } = await ActivityLog.findAndCountAll({
    where,
    order: [['createdAt', 'DESC']],
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

module.exports = ActivityLog;
