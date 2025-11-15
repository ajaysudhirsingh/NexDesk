const express = require('express');
const { body, validationResult } = require('express-validator');
const database = require('../config/database');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { generateUUID } = require('../utils/auth');
const logger = require('../utils/logger');

const router = express.Router();

// Get all teams
router.get('/', authenticate, async (req, res) => {
  try {
    const teamsCollection = database.getCollection('teams');
    const baseQuery = { client_id: req.user.client_id };
    
    const teams = await teamsCollection.find(baseQuery).toArray();
    
    // Remove MongoDB _id field
    const cleanTeams = teams.map(team => {
      const { _id, ...cleanTeam } = team;
      return cleanTeam;
    });
    
    res.json(cleanTeams);
  } catch (error) {
    logger.error('Error fetching teams', { error: error.message });
    res.status(500).json({ detail: 'Failed to fetch teams' });
  }
});

// Create team (Admin only)
router.post('/', authenticate, requireAdmin, [
  body('name').notEmpty().withMessage('Name is required'),
  body('description').optional(),
  body('manager_id').notEmpty().withMessage('Manager ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ detail: errors.array()[0].msg });
    }

    const { name, description, manager_id } = req.body;
    const teamsCollection = database.getCollection('teams');
    const usersCollection = database.getCollection('users');

    // Verify manager exists
    const manager = await usersCollection.findOne({ 
      id: manager_id, 
      client_id: req.user.client_id 
    });
    
    if (!manager) {
      return res.status(404).json({ detail: 'Manager not found' });
    }

    const newTeam = {
      id: generateUUID(),
      name,
      description: description || '',
      manager_id,
      manager_username: manager.username,
      members: [manager_id],
      client_id: req.user.client_id,
      created_at: new Date(),
      updated_at: new Date()
    };

    await teamsCollection.insertOne(newTeam);

    const { _id, ...cleanTeam } = newTeam;
    res.status(201).json(cleanTeam);
  } catch (error) {
    logger.error('Error creating team', { error: error.message });
    res.status(500).json({ detail: 'Failed to create team' });
  }
});

// Update team
router.put('/:team_id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { name, description, manager_id } = req.body;
    const teamsCollection = database.getCollection('teams');
    const usersCollection = database.getCollection('users');

    const team = await teamsCollection.findOne({ 
      id: req.params.team_id, 
      client_id: req.user.client_id 
    });
    
    if (!team) {
      return res.status(404).json({ detail: 'Team not found' });
    }

    const updateData = { updated_at: new Date() };
    
    if (name) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    
    if (manager_id) {
      const manager = await usersCollection.findOne({ 
        id: manager_id, 
        client_id: req.user.client_id 
      });
      
      if (!manager) {
        return res.status(404).json({ detail: 'Manager not found' });
      }
      
      updateData.manager_id = manager_id;
      updateData.manager_username = manager.username;
    }

    await teamsCollection.updateOne(
      { id: req.params.team_id },
      { $set: updateData }
    );

    res.json({ message: 'Team updated successfully' });
  } catch (error) {
    logger.error('Error updating team', { error: error.message });
    res.status(500).json({ detail: 'Failed to update team' });
  }
});

// Delete team
router.delete('/:team_id', authenticate, requireAdmin, async (req, res) => {
  try {
    const teamsCollection = database.getCollection('teams');
    const teamMessagesCollection = database.getCollection('team_messages');

    const team = await teamsCollection.findOne({ 
      id: req.params.team_id, 
      client_id: req.user.client_id 
    });
    
    if (!team) {
      return res.status(404).json({ detail: 'Team not found' });
    }

    // Delete team messages
    await teamMessagesCollection.deleteMany({ team_id: req.params.team_id });
    
    // Delete team
    await teamsCollection.deleteOne({ id: req.params.team_id });

    res.json({ message: 'Team deleted successfully' });
  } catch (error) {
    logger.error('Error deleting team', { error: error.message });
    res.status(500).json({ detail: 'Failed to delete team' });
  }
});

// Add member to team
router.post('/:team_id/members', authenticate, requireAdmin, [
  body('user_id').notEmpty().withMessage('User ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ detail: errors.array()[0].msg });
    }

    const { user_id } = req.body;
    const teamsCollection = database.getCollection('teams');
    const usersCollection = database.getCollection('users');

    const team = await teamsCollection.findOne({ 
      id: req.params.team_id, 
      client_id: req.user.client_id 
    });
    
    if (!team) {
      return res.status(404).json({ detail: 'Team not found' });
    }

    const user = await usersCollection.findOne({ 
      id: user_id, 
      client_id: req.user.client_id 
    });
    
    if (!user) {
      return res.status(404).json({ detail: 'User not found' });
    }

    // Check if user is already a member
    if (team.members.includes(user_id)) {
      return res.status(400).json({ detail: 'User is already a team member' });
    }

    await teamsCollection.updateOne(
      { id: req.params.team_id },
      { 
        $push: { members: user_id },
        $set: { updated_at: new Date() }
      }
    );

    res.json({ message: 'Member added successfully' });
  } catch (error) {
    logger.error('Error adding team member', { error: error.message });
    res.status(500).json({ detail: 'Failed to add team member' });
  }
});

// Remove member from team
router.delete('/:team_id/members/:user_id', authenticate, requireAdmin, async (req, res) => {
  try {
    const teamsCollection = database.getCollection('teams');

    const team = await teamsCollection.findOne({ 
      id: req.params.team_id, 
      client_id: req.user.client_id 
    });
    
    if (!team) {
      return res.status(404).json({ detail: 'Team not found' });
    }

    // Don't allow removing the manager
    if (req.params.user_id === team.manager_id) {
      return res.status(400).json({ detail: 'Cannot remove team manager' });
    }

    await teamsCollection.updateOne(
      { id: req.params.team_id },
      { 
        $pull: { members: req.params.user_id },
        $set: { updated_at: new Date() }
      }
    );

    res.json({ message: 'Member removed successfully' });
  } catch (error) {
    logger.error('Error removing team member', { error: error.message });
    res.status(500).json({ detail: 'Failed to remove team member' });
  }
});

// Get team messages
router.get('/:team_id/messages', authenticate, async (req, res) => {
  try {
    const teamsCollection = database.getCollection('teams');
    const teamMessagesCollection = database.getCollection('team_messages');

    // Check if user is a team member
    const team = await teamsCollection.findOne({ 
      id: req.params.team_id, 
      client_id: req.user.client_id 
    });
    
    if (!team) {
      return res.status(404).json({ detail: 'Team not found' });
    }

    if (!team.members.includes(req.user.id)) {
      return res.status(403).json({ detail: 'Not a team member' });
    }

    const messages = await teamMessagesCollection
      .find({ team_id: req.params.team_id })
      .sort({ created_at: -1 })
      .limit(50)
      .toArray();

    // Remove MongoDB _id field
    const cleanMessages = messages.map(message => {
      const { _id, ...cleanMessage } = message;
      return cleanMessage;
    });

    res.json(cleanMessages);
  } catch (error) {
    logger.error('Error fetching team messages', { error: error.message });
    res.status(500).json({ detail: 'Failed to fetch team messages' });
  }
});

// Send team message
router.post('/:team_id/messages', authenticate, [
  body('message').notEmpty().withMessage('Message is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ detail: errors.array()[0].msg });
    }

    const { message, media_url } = req.body;
    const teamsCollection = database.getCollection('teams');
    const teamMessagesCollection = database.getCollection('team_messages');

    // Check if user is a team member
    const team = await teamsCollection.findOne({ 
      id: req.params.team_id, 
      client_id: req.user.client_id 
    });
    
    if (!team) {
      return res.status(404).json({ detail: 'Team not found' });
    }

    if (!team.members.includes(req.user.id)) {
      return res.status(403).json({ detail: 'Not a team member' });
    }

    const newMessage = {
      id: generateUUID(),
      message,
      team_id: req.params.team_id,
      sender_id: req.user.id,
      sender_username: req.user.username,
      media_url: media_url || null,
      created_at: new Date()
    };

    await teamMessagesCollection.insertOne(newMessage);

    // Broadcast message to team members via WebSocket
    // Note: We'll need to access the teamManager from server.js
    // For now, we'll just save to database and let the frontend handle real-time updates

    const { _id, ...cleanMessage } = newMessage;
    res.status(201).json(cleanMessage);
  } catch (error) {
    logger.error('Error sending team message', { error: error.message });
    res.status(500).json({ detail: 'Failed to send team message' });
  }
});

module.exports = router;