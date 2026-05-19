const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Agent = sequelize.define('Agent', {
  id: {
    type: DataTypes.STRING(36),
    primaryKey: true,
    defaultValue: () => require('uuid').v4()
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  avatar: {
    type: DataTypes.STRING
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  role: {
    type: DataTypes.STRING,
    defaultValue: 'Support Agent'
  },
  status: {
    type: DataTypes.STRING(20),
    defaultValue: 'offline'
  },
  resolvedToday: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  totalMessages: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  avgResponseTime: {
    type: DataTypes.STRING,
    defaultValue: '0 min'
  },
  activeChats: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  timestamps: true
});

// Helper static methods
Agent.getAll = async () => {
  const agents = await Agent.findAll();
  return agents.map(a => {
    const data = a.get({ plain: true });
    delete data.password;
    return data;
  });
};

Agent.getByEmail = async (email) => {
  return await Agent.findOne({ where: { email } });
};

Agent.getById = async (id) => {
  const agent = await Agent.findByPk(id);
  if (!agent) return null;
  const data = agent.get({ plain: true });
  delete data.password;
  return data;
};

Agent.updateStatus = async (id, status) => {
  return await Agent.update({ status }, { where: { id } });
};

Agent.updateById = async (id, updates) => {
  return await Agent.update(updates, { where: { id } });
};

Agent.countOnline = async () => {
  return await Agent.count({ where: { status: 'online' } });
};

module.exports = Agent;
