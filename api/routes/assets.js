const express = require('express');
const { body, validationResult } = require('express-validator');
const database = require('../config/database');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { generateUUID } = require('../utils/auth');
const logger = require('../utils/logger');

const router = express.Router();

// Helper function to enhance asset with user info
const enhanceAssetWithUserInfo = async (asset) => {
  const usersCollection = database.getCollection('users');
  
  // Get creator info
  const creator = await usersCollection.findOne({ id: asset.created_by });
  asset.created_by_username = creator ? creator.username : 'Unknown';
  
  // Get assigned user info
  if (asset.assigned_to) {
    const assignedUser = await usersCollection.findOne({ id: asset.assigned_to });
    asset.assigned_to_username = assignedUser ? assignedUser.username : 'Unknown';
  } else {
    asset.assigned_to_username = null;
  }
  
  return asset;
};

// Get all assets
router.get('/', authenticate, async (req, res) => {
  try {
    const assetsCollection = database.getCollection('assets');
    let query = {};
    
    if (req.user.role === 'superadmin') {
      // Superadmin can see all assets across all clients
      query = {};
    } else if (['admin'].includes(req.user.role)) {
      // Admin can see all assets in their tenant
      query = { client_id: req.user.client_id };
    } else {
      // Regular users see only assets assigned to them
      query = { 
        client_id: req.user.client_id,
        assigned_to: req.user.id
      };
    }

    const assets = await assetsCollection.find(query).sort({ created_at: -1 }).toArray();
    
    // Enhance assets with user info
    const enhancedAssets = [];
    for (const asset of assets) {
      const enhancedAsset = await enhanceAssetWithUserInfo(asset);
      const { _id, ...cleanAsset } = enhancedAsset;
      enhancedAssets.push(cleanAsset);
    }
    
    res.json(enhancedAssets);
  } catch (error) {
    logger.error('Error fetching assets', { error: error.message });
    res.status(500).json({ detail: 'Failed to fetch assets' });
  }
});

// Create asset (Admin only)
router.post('/', authenticate, requireAdmin, [
  body('name').notEmpty().withMessage('Name is required'),
  body('description').optional(),
  body('asset_type').notEmpty().withMessage('Asset type is required'),
  body('value').isNumeric().withMessage('Value must be a number'),
  body('serial_number').optional()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ detail: errors.array()[0].msg });
    }

    const { name, description, asset_type, value, serial_number, media_url } = req.body;
    const assetsCollection = database.getCollection('assets');
    const clientsCollection = database.getCollection('clients');

    // Check asset limit for the client
    const client = await clientsCollection.findOne({ id: req.user.client_id });
    if (!client) {
      return res.status(400).json({ detail: 'Client not found' });
    }

    const currentAssetCount = await assetsCollection.countDocuments({
      client_id: req.user.client_id
    });

    if (currentAssetCount >= client.asset_limit) {
      return res.status(400).json({ 
        detail: `Asset limit reached. Maximum ${client.asset_limit} assets allowed.` 
      });
    }

    const newAsset = {
      id: generateUUID(),
      name,
      description: description || '',
      asset_type,
      value: parseFloat(value) || 0,
      serial_number: serial_number || null,
      assigned_to: null,
      assigned_to_username: null,
      created_by: req.user.id,
      created_by_username: req.user.username,
      client_id: req.user.client_id,
      media_url: media_url || null,
      created_at: new Date(),
      updated_at: new Date()
    };

    await assetsCollection.insertOne(newAsset);

    const { _id, ...cleanAsset } = newAsset;
    res.status(201).json(cleanAsset);
  } catch (error) {
    logger.error('Error creating asset', { error: error.message });
    res.status(500).json({ detail: 'Failed to create asset' });
  }
});

// Update asset (Admin only)
router.put('/:asset_id', authenticate, requireAdmin, async (req, res) => {
  try {
    const assetsCollection = database.getCollection('assets');
    
    // Find asset within the admin's client
    const asset = await assetsCollection.findOne({
      id: req.params.asset_id,
      client_id: req.user.client_id
    });
    
    if (!asset) {
      return res.status(404).json({ detail: 'Asset not found' });
    }

    const { name, description, asset_type, value, serial_number, assigned_to, media_url } = req.body;
    const updateData = { updated_at: new Date() };
    
    if (name) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (asset_type) updateData.asset_type = asset_type;
    if (value !== undefined) updateData.value = parseFloat(value) || 0;
    if (serial_number !== undefined) updateData.serial_number = serial_number;
    if (media_url !== undefined) updateData.media_url = media_url;
    
    // Handle assignment
    if (assigned_to !== undefined) {
      if (assigned_to) {
        const usersCollection = database.getCollection('users');
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

    await assetsCollection.updateOne(
      { id: req.params.asset_id },
      { $set: updateData }
    );

    const updatedAsset = await assetsCollection.findOne({ id: req.params.asset_id });
    const enhancedAsset = await enhanceAssetWithUserInfo(updatedAsset);
    const { _id, ...cleanAsset } = enhancedAsset;
    res.json(cleanAsset);
  } catch (error) {
    logger.error('Error updating asset', { error: error.message });
    res.status(500).json({ detail: 'Failed to update asset' });
  }
});

// Assign asset (Admin only)
router.put('/:asset_id/assign', authenticate, requireAdmin, [
  body('assigned_to').notEmpty().withMessage('Assigned user ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ detail: errors.array()[0].msg });
    }

    const { assigned_to } = req.body;
    const assetsCollection = database.getCollection('assets');
    const usersCollection = database.getCollection('users');
    
    // Find asset within the admin's client
    const asset = await assetsCollection.findOne({
      id: req.params.asset_id,
      client_id: req.user.client_id
    });
    
    if (!asset) {
      return res.status(404).json({ detail: 'Asset not found' });
    }

    // Verify assigned user exists and belongs to same client
    const assignedUser = await usersCollection.findOne({ 
      id: assigned_to, 
      client_id: req.user.client_id 
    });
    
    if (!assignedUser) {
      return res.status(400).json({ detail: 'Assigned user not found' });
    }

    // Prevent assigning assets to superadmin unless current user is superadmin
    if (assignedUser.role === 'superadmin' && req.user.role !== 'superadmin') {
      return res.status(403).json({ detail: 'Cannot assign assets to superadmin' });
    }

    await assetsCollection.updateOne(
      { id: req.params.asset_id },
      { 
        $set: { 
          assigned_to,
          assigned_to_username: assignedUser.username,
          updated_at: new Date()
        } 
      }
    );

    const updatedAsset = await assetsCollection.findOne({ id: req.params.asset_id });
    const enhancedAsset = await enhanceAssetWithUserInfo(updatedAsset);
    const { _id, ...cleanAsset } = enhancedAsset;
    res.json(cleanAsset);
  } catch (error) {
    logger.error('Error assigning asset', { error: error.message });
    res.status(500).json({ detail: 'Failed to assign asset' });
  }
});

// Delete asset (Admin only)
router.delete('/:asset_id', authenticate, requireAdmin, async (req, res) => {
  try {
    const assetsCollection = database.getCollection('assets');
    
    // Find asset within the admin's client
    const asset = await assetsCollection.findOne({
      id: req.params.asset_id,
      client_id: req.user.client_id
    });
    
    if (!asset) {
      return res.status(404).json({ detail: 'Asset not found' });
    }

    await assetsCollection.deleteOne({ id: req.params.asset_id });
    res.json({ message: 'Asset deleted successfully' });
  } catch (error) {
    logger.error('Error deleting asset', { error: error.message });
    res.status(500).json({ detail: 'Failed to delete asset' });
  }
});

module.exports = router;