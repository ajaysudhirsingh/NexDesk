const express = require('express');
const { body, validationResult } = require('express-validator');
const database = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { generateUUID } = require('../utils/auth');
const logger = require('../utils/logger');

const router = express.Router();

// Get all messages
router.get('/', authenticate, async (req, res) => {
  try {
    const messagesCollection = database.getCollection('messages');
    const baseQuery = { client_id: req.user.client_id };
    
    const messages = await messagesCollection
      .find(baseQuery)
      .sort({ created_at: -1 })
      .toArray();
    
    // Remove MongoDB _id field
    const cleanMessages = messages.map(message => {
      const { _id, ...cleanMessage } = message;
      return cleanMessage;
    });
    
    res.json(cleanMessages);
  } catch (error) {
    logger.error('Error fetching messages', { error: error.message });
    res.status(500).json({ detail: 'Failed to fetch messages' });
  }
});

// Send message
router.post('/', authenticate, [
  body('message').notEmpty().withMessage('Message is required'),
  body('recipient_id').optional()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ detail: errors.array()[0].msg });
    }

    const { message, recipient_id, media_url } = req.body;
    const messagesCollection = database.getCollection('messages');
    const usersCollection = database.getCollection('users');

    let recipientUsername = null;
    let isPublic = true;

    // Verify recipient exists if it's a private message
    if (recipient_id) {
      const recipient = await usersCollection.findOne({ 
        id: recipient_id, 
        client_id: req.user.client_id 
      });
      
      if (!recipient) {
        return res.status(404).json({ detail: 'Recipient not found' });
      }
      
      recipientUsername = recipient.username;
      isPublic = false;
    }

    const newMessage = {
      id: generateUUID(),
      message,
      sender_id: req.user.id,
      sender_username: req.user.username,
      recipient_id: recipient_id || null,
      recipient_username: recipientUsername,
      is_public: isPublic,
      client_id: req.user.client_id,
      media_url: media_url || null,
      created_at: new Date()
    };

    await messagesCollection.insertOne(newMessage);

    const { _id, ...cleanMessage } = newMessage;
    res.status(201).json(cleanMessage);
  } catch (error) {
    logger.error('Error sending message', { error: error.message });
    res.status(500).json({ detail: 'Failed to send message' });
  }
});

// Get messages for a specific conversation
router.get('/conversation/:user_id', authenticate, async (req, res) => {
  try {
    const messagesCollection = database.getCollection('messages');
    const usersCollection = database.getCollection('users');
    
    // Verify the other user exists and belongs to same client
    const otherUser = await usersCollection.findOne({ 
      id: req.params.user_id, 
      client_id: req.user.client_id 
    });
    
    if (!otherUser) {
      return res.status(404).json({ detail: 'User not found' });
    }

    // Get messages between current user and the specified user
    const messages = await messagesCollection
      .find({
        client_id: req.user.client_id,
        $or: [
          { sender_id: req.user.id, recipient_id: req.params.user_id },
          { sender_id: req.params.user_id, recipient_id: req.user.id }
        ]
      })
      .sort({ created_at: 1 })
      .toArray();
    
    // Remove MongoDB _id field
    const cleanMessages = messages.map(message => {
      const { _id, ...cleanMessage } = message;
      return cleanMessage;
    });
    
    res.json(cleanMessages);
  } catch (error) {
    logger.error('Error fetching conversation', { error: error.message });
    res.status(500).json({ detail: 'Failed to fetch conversation' });
  }
});

// Get public messages
router.get('/public', authenticate, async (req, res) => {
  try {
    const messagesCollection = database.getCollection('messages');
    
    const messages = await messagesCollection
      .find({
        client_id: req.user.client_id,
        is_public: true
      })
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
    logger.error('Error fetching public messages', { error: error.message });
    res.status(500).json({ detail: 'Failed to fetch public messages' });
  }
});

// Delete message (only sender can delete)
router.delete('/:message_id', authenticate, async (req, res) => {
  try {
    const messagesCollection = database.getCollection('messages');
    
    const message = await messagesCollection.findOne({ 
      id: req.params.message_id,
      client_id: req.user.client_id 
    });
    
    if (!message) {
      return res.status(404).json({ detail: 'Message not found' });
    }

    // Only sender or admin can delete
    if (message.sender_id !== req.user.id && !['admin', 'superadmin'].includes(req.user.role)) {
      return res.status(403).json({ detail: 'Not authorized to delete this message' });
    }

    await messagesCollection.deleteOne({ id: req.params.message_id });
    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    logger.error('Error deleting message', { error: error.message });
    res.status(500).json({ detail: 'Failed to delete message' });
  }
});

module.exports = router;