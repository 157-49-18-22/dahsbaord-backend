const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const AgentGroup = sequelize.define('AgentGroup', {
  id: {
    type: DataTypes.STRING(36),
    primaryKey: true,
    defaultValue: () => require('uuid').v4()
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  description: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  tableName: 'agent_groups',
  timestamps: true
});

module.exports = AgentGroup;
