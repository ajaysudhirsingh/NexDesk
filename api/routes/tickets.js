const express = require('express');
const { body, validationResult } = require('express-validator');
const database = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { generateUUID } = require('../utils/auth');
const logger = require('../utils/logger');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// Helper function to enhance ticket with user info - exactly matching Python
const enhanceTicketWithUserInfo = async (ticket) => {
  const usersCollection = database.getCollection('users');
  
  // Ensure media_url field exists (for backward compatibility)
  if (!ticket.media_url) {
    ticket.media_url = null;
  }
  
  // Check if media file actually exists
  if (ticket.media_url) {
    const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');
    const filePath = path.join(UPLOADS_DIR, ticket.media_url.replace('/uploads/', ''));
    if (!fs.existsSync(filePath)) {
      logger.warn(`Media file not found: ${filePath}`);
      ticket.media_url = null;
    }
  }
  
  // Get creator info
  const creator = await usersCollection.findOne({ id: ticket.created_by });
  ticket.created_by_username = creator ? creator.username : 'Unknown';
  
  // Get assigned user info
  if (ticket.assigned_to) {
    const assignedUser = await usersCollection.findOne({ id: ticket.assigned_to });
    ticket.assigned_to_username = assignedUser ? assignedUser.username : 'Unknown';
  } else {
    ticket.assigned_to_username = null;
  }
  
  // Get closer info
  if (ticket.closed_by) {
    const closer = await usersCollection.findOne({ id: ticket.closed_by });
    ticket.closed_by_username = closer ? closer.username : 'Unknown';
  } else {
    ticket.closed_by_username = null;
  }
  
  return ticket;
};

// Helper function to check if user can view ticket - exactly matching Python
const canViewTicket = (ticket, currentUser) => {
  // Admin can see all tickets
  if (currentUser.role === 'admin' || currentUser.role === 'superadmin') {
    return true;
  }
  
  // Creator can see their own tickets
  if (ticket.created_by === currentUser.id) {
    return true;
  }
  
  // Assigned user can see assigned tickets
  if (ticket.assigned_to === currentUser.id) {
    return true;
  }
  
  // User who closed the ticket can see it
  if (ticket.closed_by === currentUser.id) {
    return true;
  }
  
  return false;
};

// Get all tickets with filtering and sorting
router.get('/', authenticate, async (req, res) => {
  try {
    const ticketsCollection = database.getCollection('tickets');
    const baseQuery = { client_id: req.user.client_id };
    
    // Apply filters
    const {
      sort_by = 'created_at',
      sort_order = 'desc',
      status_filter,
      priority_filter,
      assigned_to_filter,
      created_by_filter,
      search
    } = req.query;
    
    if (status_filter) baseQuery.status = status_filter;
    if (priority_filter) baseQuery.priority = priority_filter;
    if (assigned_to_filter) baseQuery.assigned_to = assigned_to_filter;
    if (created_by_filter) baseQuery.created_by = created_by_filter;
    if (search) {
      baseQuery.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    const sortOrder = sort_order === 'desc' ? -1 : 1;
    const tickets = await ticketsCollection
      .find(baseQuery)
      .sort({ [sort_by]: sortOrder })
      .toArray();
    
    // Filter tickets based on user permissions and enhance with user info
    const filteredTickets = [];
    for (const ticket of tickets) {
      if (canViewTicket(ticket, req.user)) {
        const enhancedTicket = await enhanceTicketWithUserInfo(ticket);
        const { _id, ...cleanTicket } = enhancedTicket;
        filteredTickets.push(cleanTicket);
      }
    }
    
    res.json(filteredTickets);
  } catch (error) {
    logger.error('Error fetching tickets', { error: error.message });
    res.status(500).json({ detail: 'Failed to fetch tickets' });
  }
});

// Get open tickets
router.get('/open', authenticate, async (req, res) => {
  try {
    const ticketsCollection = database.getCollection('tickets');
    const baseQuery = { 
      client_id: req.user.client_id,
      status: { $in: ['open', 'in_progress'] }
    };
    
    // Apply same filtering as main tickets endpoint
    const {
      sort_by = 'created_at',
      sort_order = 'desc',
      priority_filter,
      assigned_to_filter,
      created_by_filter,
      search
    } = req.query;
    
    if (priority_filter) baseQuery.priority = priority_filter;
    if (assigned_to_filter) baseQuery.assigned_to = assigned_to_filter;
    if (created_by_filter) baseQuery.created_by = created_by_filter;
    if (search) {
      baseQuery.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    const sortOrder = sort_order === 'desc' ? -1 : 1;
    const tickets = await ticketsCollection
      .find(baseQuery)
      .sort({ [sort_by]: sortOrder })
      .toArray();
    
    const filteredTickets = [];
    for (const ticket of tickets) {
      if (canViewTicket(ticket, req.user)) {
        const enhancedTicket = await enhanceTicketWithUserInfo(ticket);
        const { _id, ...cleanTicket } = enhancedTicket;
        filteredTickets.push(cleanTicket);
      }
    }
    
    res.json(filteredTickets);
  } catch (error) {
    logger.error('Error fetching open tickets', { error: error.message });
    res.status(500).json({ detail: 'Failed to fetch open tickets' });
  }
});

// Get closed tickets
router.get('/closed', authenticate, async (req, res) => {
  try {
    const ticketsCollection = database.getCollection('tickets');
    const baseQuery = { 
      client_id: req.user.client_id,
      status: 'closed'
    };
    
    // Apply same filtering as main tickets endpoint
    const {
      sort_by = 'created_at',
      sort_order = 'desc',
      priority_filter,
      assigned_to_filter,
      created_by_filter,
      search
    } = req.query;
    
    if (priority_filter) baseQuery.priority = priority_filter;
    if (assigned_to_filter) baseQuery.assigned_to = assigned_to_filter;
    if (created_by_filter) baseQuery.created_by = created_by_filter;
    if (search) {
      baseQuery.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    const sortOrder = sort_order === 'desc' ? -1 : 1;
    const tickets = await ticketsCollection
      .find(baseQuery)
      .sort({ [sort_by]: sortOrder })
      .toArray();
    
    const filteredTickets = [];
    for (const ticket of tickets) {
      if (canViewTicket(ticket, req.user)) {
        const enhancedTicket = await enhanceTicketWithUserInfo(ticket);
        const { _id, ...cleanTicket } = enhancedTicket;
        filteredTickets.push(cleanTicket);
      }
    }
    
    res.json(filteredTickets);
  } catch (error) {
    logger.error('Error fetching closed tickets', { error: error.message });
    res.status(500).json({ detail: 'Failed to fetch closed tickets' });
  }
});

// Get filter options
router.get('/filter-options', authenticate, async (req, res) => {
  try {
    const ticketsCollection = database.getCollection('tickets');
    const usersCollection = database.getCollection('users');
    
    const baseQuery = { client_id: req.user.client_id };
    
    // Get unique values for filters
    const [statuses, priorities, allUsers] = await Promise.all([
      ticketsCollection.distinct('status', baseQuery),
      ticketsCollection.distinct('priority', baseQuery),
      usersCollection.find({ client_id: req.user.client_id }, { 
        projection: { id: 1, username: 1 } 
      }).toArray()
    ]);
    
    res.json({
      statuses: statuses.map(status => ({ value: status, label: status })),
      priorities: priorities.map(priority => ({ value: priority, label: priority })),
      users: allUsers.map(user => ({ value: user.id, label: user.username }))
    });
  } catch (error) {
    logger.error('Error fetching filter options', { error: error.message });
    res.status(500).json({ detail: 'Failed to fetch filter options' });
  }
});

// Get single ticket
router.get('/:ticket_id', authenticate, async (req, res) => {
  try {
    const ticketsCollection = database.getCollection('tickets');
    const ticket = await ticketsCollection.findOne({ 
      id: req.params.ticket_id,
      client_id: req.user.client_id 
    });
    
    if (!ticket) {
      return res.status(404).json({ detail: 'Ticket not found' });
    }
    
    if (!canViewTicket(ticket, req.user)) {
      return res.status(403).json({ detail: 'Not authorized to view this ticket' });
    }
    
    const enhancedTicket = await enhanceTicketWithUserInfo(ticket);
    const { _id, ...cleanTicket } = enhancedTicket;
    res.json(cleanTicket);
  } catch (error) {
    logger.error('Error fetching ticket', { error: error.message });
    res.status(500).json({ detail: 'Failed to fetch ticket' });
  }
});

// Create ticket
router.post('/', authenticate, [
  body('title').notEmpty().withMessage('Title is required'),
  body('description').notEmpty().withMessage('Description is required'),
  body('priority').optional().isIn(['low', 'medium', 'high']).withMessage('Invalid priority')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ detail: errors.array()[0].msg });
    }

    const { title, description, priority = 'medium', assigned_to, media_url } = req.body;
    const ticketsCollection = database.getCollection('tickets');
    const usersCollection = database.getCollection('users');

    // Validate assigned user if provided
    if (assigned_to) {
      const assignedUser = await usersCollection.findOne({ 
        id: assigned_to, 
        client_id: req.user.client_id 
      });
      if (!assignedUser) {
        return res.status(400).json({ detail: 'Assigned user not found' });
      }
    }

    const newTicket = {
      id: generateUUID(),
      title,
      description,
      status: 'open',
      priority,
      assigned_to: assigned_to || null,
      assigned_to_username: null,
      created_by: req.user.id,
      created_by_username: req.user.username,
      client_id: req.user.client_id,
      media_url: media_url || null,
      close_comment: null,
      closed_at: null,
      closed_by: null,
      closed_by_username: null,
      created_at: new Date(),
      updated_at: new Date()
    };

    await ticketsCollection.insertOne(newTicket);
    
    const enhancedTicket = await enhanceTicketWithUserInfo(newTicket);
    const { _id, ...cleanTicket } = enhancedTicket;
    res.status(201).json(cleanTicket);
  } catch (error) {
    logger.error('Error creating ticket', { error: error.message });
    res.status(500).json({ detail: 'Failed to create ticket' });
  }
});

// Update ticket
router.put('/:ticket_id', authenticate, async (req, res) => {
  try {
    const ticketsCollection = database.getCollection('tickets');
    const usersCollection = database.getCollection('users');
    
    const ticket = await ticketsCollection.findOne({ 
      id: req.params.ticket_id,
      client_id: req.user.client_id 
    });
    
    if (!ticket) {
      return res.status(404).json({ detail: 'Ticket not found' });
    }
    
    if (!canViewTicket(ticket, req.user)) {
      return res.status(403).json({ detail: 'Not authorized to update this ticket' });
    }

    const { title, description, status, priority, assigned_to } = req.body;
    const updateData = { updated_at: new Date() };
    
    if (title) updateData.title = title;
    if (description) updateData.description = description;
    if (status && ['open', 'in_progress', 'closed'].includes(status)) {
      updateData.status = status;
    }
    if (priority && ['low', 'medium', 'high'].includes(priority)) {
      updateData.priority = priority;
    }
    
    if (assigned_to !== undefined) {
      if (assigned_to) {
        const assignedUser = await usersCollection.findOne({ 
          id: assigned_to, 
          client_id: req.user.client_id 
        });
        if (!assignedUser) {
          return res.status(400).json({ detail: 'Assigned user not found' });
        }
        updateData.assigned_to = assigned_to;
        updateData.assigned_to_username = assignedUser.username;
      } else {
        updateData.assigned_to = null;
        updateData.assigned_to_username = null;
      }
    }

    await ticketsCollection.updateOne(
      { id: req.params.ticket_id },
      { $set: updateData }
    );

    const updatedTicket = await ticketsCollection.findOne({ id: req.params.ticket_id });
    const enhancedTicket = await enhanceTicketWithUserInfo(updatedTicket);
    const { _id, ...cleanTicket } = enhancedTicket;
    res.json(cleanTicket);
  } catch (error) {
    logger.error('Error updating ticket', { error: error.message });
    res.status(500).json({ detail: 'Failed to update ticket' });
  }
});

// Close ticket
router.put('/:ticket_id/close', authenticate, [
  body('close_comment').notEmpty().withMessage('Close comment is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ detail: errors.array()[0].msg });
    }

    const { close_comment } = req.body;
    const ticketsCollection = database.getCollection('tickets');
    
    const ticket = await ticketsCollection.findOne({ 
      id: req.params.ticket_id,
      client_id: req.user.client_id 
    });
    
    if (!ticket) {
      return res.status(404).json({ detail: 'Ticket not found' });
    }
    
    if (!canViewTicket(ticket, req.user)) {
      return res.status(403).json({ detail: 'Not authorized to close this ticket' });
    }

    const updateData = {
      status: 'closed',
      close_comment,
      closed_at: new Date(),
      closed_by: req.user.id,
      closed_by_username: req.user.username,
      updated_at: new Date()
    };

    await ticketsCollection.updateOne(
      { id: req.params.ticket_id },
      { $set: updateData }
    );

    const updatedTicket = await ticketsCollection.findOne({ id: req.params.ticket_id });
    const enhancedTicket = await enhanceTicketWithUserInfo(updatedTicket);
    const { _id, ...cleanTicket } = enhancedTicket;
    res.json(cleanTicket);
  } catch (error) {
    logger.error('Error closing ticket', { error: error.message });
    res.status(500).json({ detail: 'Failed to close ticket' });
  }
});

// Delete ticket
router.delete('/:ticket_id', authenticate, async (req, res) => {
  try {
    const ticketsCollection = database.getCollection('tickets');
    
    const ticket = await ticketsCollection.findOne({ 
      id: req.params.ticket_id,
      client_id: req.user.client_id 
    });
    
    if (!ticket) {
      return res.status(404).json({ detail: 'Ticket not found' });
    }
    
    // Only allow creator or admin to delete
    if (ticket.created_by !== req.user.id && !['admin', 'superadmin'].includes(req.user.role)) {
      return res.status(403).json({ detail: 'Not authorized to delete this ticket' });
    }

    await ticketsCollection.deleteOne({ id: req.params.ticket_id });
    res.json({ message: 'Ticket deleted successfully' });
  } catch (error) {
    logger.error('Error deleting ticket', { error: error.message });
    res.status(500).json({ detail: 'Failed to delete ticket' });
  }
});

module.exports = router;