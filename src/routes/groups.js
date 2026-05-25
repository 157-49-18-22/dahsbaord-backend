const express = require('express');
const router = express.Router();
const AgentGroup = require('../models/AgentGroup');
const Agent = require('../models/Agent');

// Get all groups with agent counts
router.get('/', async (req, res, next) => {
  try {
    const groups = await AgentGroup.findAll();
    const agents = await Agent.findAll({ attributes: ['id', 'groupId'] });
    
    const results = groups.map(g => {
      const data = g.get({ plain: true });
      data.agentCount = agents.filter(a => a.groupId === data.id).length;
      return data;
    });

    res.json({ success: true, data: results });
  } catch (err) {
    next(err);
  }
});

// Create a new group
router.post('/', async (req, res, next) => {
  try {
    const { name, description, agentIds } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Group name is required' });

    const existing = await AgentGroup.findOne({ where: { name } });
    if (existing) return res.status(400).json({ success: false, message: 'Group with this name already exists' });

    const group = await AgentGroup.create({ name, description });

    if (agentIds && Array.isArray(agentIds) && agentIds.length > 0) {
      const { Op } = require('sequelize');
      await Agent.update({ groupId: group.id }, { where: { id: { [Op.in]: agentIds } } });
    }

    res.status(201).json({ success: true, data: group });
  } catch (err) {
    next(err);
  }
});

// Update group members (add/remove agents)
router.patch('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { agentIds } = req.body;
    const group = await AgentGroup.findByPk(id);
    if (!group) return res.status(404).json({ success: false, message: 'Group not found' });

    const { Op } = require('sequelize');
    // Remove all agents currently in this group
    await Agent.update({ groupId: null }, { where: { groupId: id } });
    // Assign the new set of agents
    if (agentIds && Array.isArray(agentIds) && agentIds.length > 0) {
      await Agent.update({ groupId: id }, { where: { id: { [Op.in]: agentIds } } });
    }

    // Return updated agent count
    const updatedAgents = await Agent.findAll({ attributes: ['id', 'groupId'] });
    const agentCount = updatedAgents.filter(a => a.groupId === id).length;

    res.json({ success: true, message: 'Group updated successfully', data: { ...group.get({ plain: true }), agentCount } });
  } catch (err) {
    next(err);
  }
});

// Delete a group
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const group = await AgentGroup.findByPk(id);
    if (!group) return res.status(404).json({ success: false, message: 'Group not found' });

    // Unassign agents from this group
    await Agent.update({ groupId: null }, { where: { groupId: id } });

    await group.destroy();
    res.json({ success: true, message: 'Group removed successfully' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
