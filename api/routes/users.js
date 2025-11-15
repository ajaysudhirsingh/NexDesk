const express = require('express');
const { body, validationResult } = require('express-validator');
const database = require('../config/database');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { hashPassword, generateUUID } = require('../utils/auth');
const logger = require('../utils/logger');

const router = express.Router();

// Get all users
router.get('/', authenticate, async (req, res) => {
  try {
    const usersCollection = database.getCollection('users');
    let query = {};
    
    if (req.user.role === 'superadmin') {
      // Superadmin can see all users across all clients
      query = {};
    } else {
      // Regular users see only users from their client (excluding superadmin)
      query = {
        client_id: req.user.client_id,
        role: { $ne: 'superadmin' }
      };
    }

    const users = await usersCollection.find(query, { 
      projection: { password_hash: 0, _id: 0 } 
    }).toArray();
    
    res.json(users);
  } catch (error) {
    logger.error('Error fetching users', { error: error.message });
    res.status(500).json({ detail: 'Failed to fetch users' });
  }
});

// Create user (Admin only)
router.post('/', authenticate, requireAdmin, [
  body('username').notEmpty().withMessage('Username is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').optional().isIn(['user', 'admin']).withMessage('Invalid role')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ detail: errors.array()[0].msg });
    }

    const { username, email, password, role = 'user' } = req.body;
    const usersCollection = database.getCollection('users');
    const clientsCollection = database.getCollection('clients');

    // Prevent regular admins from creating superadmin users
    if (role === 'superadmin' && req.user.role !== 'superadmin') {
      return res.status(403).json({ detail: 'Cannot create superadmin user' });
    }

    // Check if username already exists within the same client
    const existingUser = await usersCollection.findOne({ 
      username, 
      client_id: req.user.client_id 
    });
    if (existingUser) {
      return res.status(400).json({ detail: 'Username already exists in this client' });
    }

    // Check if email already exists within the same client
    const existingEmail = await usersCollection.findOne({ 
      email, 
      client_id: req.user.client_id 
    });
    if (existingEmail) {
      return res.status(400).json({ detail: 'Email already exists in this client' });
    }

    // Check user limit for the client
    const client = await clientsCollection.findOne({ id: req.user.client_id });
    if (!client) {
      return res.status(400).json({ detail: 'Client not found' });
    }

    const currentUserCount = await usersCollection.countDocuments({
      client_id: req.user.client_id,
      role: { $ne: 'superadmin' }
    });

    if (currentUserCount >= client.user_limit) {
      return res.status(400).json({ 
        detail: `User limit reached. Maximum ${client.user_limit} users allowed.` 
      });
    }

    const newUser = {
      id: generateUUID(),
      username,
      email,
      password_hash: hashPassword(password),
      role,
      client_id: req.user.client_id,
      created_at: new Date()
    };

    await usersCollection.insertOne(newUser);

    // Return user without password
    const { password_hash, _id, ...userResponse } = newUser;
    res.status(201).json(userResponse);
  } catch (error) {
    logger.error('Error creating user', { error: error.message });
    res.status(500).json({ detail: 'Failed to create user' });
  }
});

// Reset user password (Admin only)
router.put('/:user_id/reset-password', authenticate, requireAdmin, [
  body('new_password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ detail: errors.array()[0].msg });
    }

    const { new_password } = req.body;
    const usersCollection = database.getCollection('users');

    const user = await usersCollection.findOne({ id: req.params.user_id });
    if (!user) {
      return res.status(404).json({ detail: 'User not found' });
    }

    // Only prevent regular admin from resetting superadmin password
    // Superadmin can reset anyone's password, including their own
    if (user.role === 'superadmin' && req.user.role !== 'superadmin') {
      return res.status(403).json({ detail: 'Cannot reset superadmin password' });
    }

    // Ensure user belongs to same client (unless superadmin)
    if (req.user.role !== 'superadmin' && user.client_id !== req.user.client_id) {
      return res.status(403).json({ detail: 'Cannot reset password for user from different client' });
    }

    await usersCollection.updateOne(
      { id: req.params.user_id },
      { $set: { password_hash: hashPassword(new_password) } }
    );

    logger.info('Password reset by admin', { 
      adminId: req.user.id, 
      adminUsername: req.user.username,
      targetUserId: req.params.user_id,
      targetUsername: user.username 
    });

    res.json({ message: `Password reset successfully for user ${user.username}` });
  } catch (error) {
    logger.error('Error resetting password', { error: error.message });
    res.status(500).json({ detail: 'Failed to reset password' });
  }
});

// Update username (Admin only)
router.put('/:user_id/update-username', authenticate, requireAdmin, [
  body('new_username').notEmpty().withMessage('New username is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ detail: errors.array()[0].msg });
    }

    const { new_username } = req.body;
    const usersCollection = database.getCollection('users');

    const user = await usersCollection.findOne({ id: req.params.user_id });
    if (!user) {
      return res.status(404).json({ detail: 'User not found' });
    }

    // Prevent admin from modifying superadmin
    if (user.role === 'superadmin' && req.user.role !== 'superadmin') {
      return res.status(403).json({ detail: 'Cannot modify superadmin user' });
    }

    // Ensure user belongs to same client (unless superadmin)
    if (req.user.role !== 'superadmin' && user.client_id !== req.user.client_id) {
      return res.status(403).json({ detail: 'Cannot modify user from different client' });
    }

    // Check if new username already exists within the same client
    const existingUser = await usersCollection.findOne({ 
      username: new_username,
      client_id: req.user.client_id,
      id: { $ne: req.params.user_id }
    });
    if (existingUser) {
      return res.status(400).json({ detail: 'Username already exists in this client' });
    }

    await usersCollection.updateOne(
      { id: req.params.user_id },
      { $set: { username: new_username } }
    );

    res.json({ message: `Username updated successfully from '${user.username}' to '${new_username}'` });
  } catch (error) {
    logger.error('Error updating username', { error: error.message });
    res.status(500).json({ detail: 'Failed to update username' });
  }
});

// Change own password (Any authenticated user)
router.put('/change-password', authenticate, [
  body('current_password').notEmpty().withMessage('Current password is required'),
  body('new_password').isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ detail: errors.array()[0].msg });
    }

    const { current_password, new_password } = req.body;
    const usersCollection = database.getCollection('users');
    const { verifyPassword } = require('../utils/auth');

    // Get current user from database
    const user = await usersCollection.findOne({ id: req.user.id });
    if (!user) {
      return res.status(404).json({ detail: 'User not found' });
    }

    // Verify current password
    if (!verifyPassword(current_password, user.password_hash)) {
      return res.status(400).json({ detail: 'Current password is incorrect' });
    }

    // Update password
    await usersCollection.updateOne(
      { id: req.user.id },
      { $set: { password_hash: hashPassword(new_password) } }
    );

    logger.info('Password changed successfully', { 
      userId: req.user.id, 
      username: req.user.username,
      role: req.user.role 
    });

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    logger.error('Error changing password', { error: error.message });
    res.status(500).json({ detail: 'Failed to change password' });
  }
});

// Delete user (Admin only)
router.delete('/:user_id', authenticate, requireAdmin, async (req, res) => {
  try {
    const usersCollection = database.getCollection('users');

    const user = await usersCollection.findOne({ id: req.params.user_id });
    if (!user) {
      return res.status(404).json({ detail: 'User not found' });
    }

    // Prevent admin from deleting superadmin
    if (user.role === 'superadmin' && req.user.role !== 'superadmin') {
      return res.status(403).json({ detail: 'Cannot delete superadmin user' });
    }

    // Ensure user belongs to same client (unless superadmin)
    if (req.user.role !== 'superadmin' && user.client_id !== req.user.client_id) {
      return res.status(403).json({ detail: 'Cannot delete user from different client' });
    }

    // Prevent self-deletion
    if (user.id === req.user.id) {
      return res.status(400).json({ detail: 'Cannot delete your own account' });
    }

    await usersCollection.deleteOne({ id: req.params.user_id });
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    logger.error('Error deleting user', { error: error.message });
    res.status(500).json({ detail: 'Failed to delete user' });
  }
});

module.exports = router;