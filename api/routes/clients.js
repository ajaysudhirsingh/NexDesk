const express = require('express');
const { body, validationResult } = require('express-validator');
const database = require('../config/database');
const { authenticate, requireSuperAdmin, requireSuperAdminOrSetup } = require('../middleware/auth');
const { hashPassword, generateUUID } = require('../utils/auth');
const logger = require('../utils/logger');

const router = express.Router();

// Create client (Superadmin only)
router.post('/', authenticate, requireSuperAdminOrSetup, [
  body('name').notEmpty().withMessage('Name is required'),
  body('code').notEmpty().withMessage('Code is required'),
  body('contact_email').isEmail().withMessage('Valid email is required')
], async (req, res) => {
  try {
    console.log('🏢 Client creation request received');
    
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ detail: errors.array()[0].msg });
    }

    const { name, code, contact_email, contact_phone, address, user_limit, asset_limit } = req.body;
    
    const clientsCollection = database.getCollection('clients');
    const usersCollection = database.getCollection('users');

    // Check if client code already exists
    const existingClient = await clientsCollection.findOne({ code });
    if (existingClient) {
      return res.status(400).json({ detail: 'Client code already exists' });
    }

    // Generate IDs
    const clientId = generateUUID();
    const adminUserId = generateUUID();

    // Create new client
    const newClient = {
      id: clientId,
      name: name.trim(),
      code: code.trim().toUpperCase(),
      contact_email: contact_email.trim(),
      contact_phone: contact_phone ? contact_phone.trim() : null,
      address: address ? address.trim() : null,
      user_limit: parseInt(user_limit) || 10,
      asset_limit: parseInt(asset_limit) || 50,
      is_active: true,
      created_at: new Date(),
      stats: {
        total_tickets: 0,
        open_tickets: 0,
        closed_tickets: 0,
        total_assets: 0,
        total_asset_value: 0,
        total_users: 1
      }
    };

    // Create default admin user - username can be repeated across clients
    const adminUsername = 'admin';
    
    // Check if admin user already exists for THIS client only
    const existingAdmin = await usersCollection.findOne({ 
      username: adminUsername, 
      client_id: clientId 
    });
    if (existingAdmin) {
      return res.status(400).json({ 
        detail: `Admin user already exists for this client.` 
      });
    }

    const adminUser = {
      id: adminUserId,
      username: adminUsername,
      email: contact_email.trim(),
      password_hash: hashPassword('admin123'),
      role: 'admin',
      client_id: clientId,
      created_at: new Date()
    };

    // Insert client first
    await clientsCollection.insertOne(newClient);
    console.log('✅ Client created:', newClient.name, 'with code:', newClient.code);

    // Insert admin user with error handling
    try {
      await usersCollection.insertOne(adminUser);
      console.log('✅ Default admin user created for client:', newClient.code);
    } catch (adminError) {
      // If admin user creation fails, remove the client to maintain consistency
      await clientsCollection.deleteOne({ id: clientId });
      console.error('❌ Admin user creation failed, rolling back client creation:', adminError.message);
      
      if (adminError.code === 11000) {
        return res.status(400).json({ 
          detail: `Admin user already exists for this client.` 
        });
      }
      throw adminError;
    }

    // Verify admin user exists
    const verifyAdmin = await usersCollection.findOne({ 
      client_id: clientId, 
      username: adminUsername 
    });

    if (!verifyAdmin) {
      // Rollback client creation if admin verification fails
      await clientsCollection.deleteOne({ id: clientId });
      throw new Error('Admin user creation verification failed');
    }

    logger.info(`Client created: ${name} (${code}) with default admin user`);

    // Return success response
    res.status(201).json({
      message: 'Client created successfully',
      client: {
        id: newClient.id,
        name: newClient.name,
        code: newClient.code,
        contact_email: newClient.contact_email,
        user_limit: newClient.user_limit,
        asset_limit: newClient.asset_limit
      },
      admin_credentials: {
        username: adminUsername,
        password: 'admin123',
        email: contact_email,
        client_code: code.trim().toUpperCase(),
        note: 'Default admin user created. Please change password after first login.'
      }
    });

  } catch (error) {
    console.error('❌ Error creating client:', error.message);
    logger.error('Client creation failed', { 
      error: error.message,
      requestData: req.body
    });
    
    res.status(500).json({ 
      detail: 'Failed to create client: ' + error.message
    });
  }
});

// Get all clients (Superadmin only)
router.get('/', authenticate, requireSuperAdminOrSetup, async (req, res) => {
  try {
    const clientsCollection = database.getCollection('clients');
    const clients = await clientsCollection.find({}, { projection: { _id: 0 } }).toArray();
    res.json(clients);
  } catch (error) {
    res.status(500).json({ detail: 'Failed to fetch clients' });
  }
});

// Get client by ID (Superadmin only)
router.get('/:client_id', authenticate, requireSuperAdmin, async (req, res) => {
  try {
    const clientsCollection = database.getCollection('clients');
    const client = await clientsCollection.findOne({ id: req.params.client_id }, { projection: { _id: 0 } });
    if (!client) {
      return res.status(404).json({ detail: 'Client not found' });
    }
    res.json(client);
  } catch (error) {
    res.status(500).json({ detail: 'Failed to fetch client' });
  }
});

// Get client statistics (Superadmin only)
router.get('/:client_id/stats', authenticate, requireSuperAdmin, async (req, res) => {
  try {
    const clientId = req.params.client_id;
    const clientsCollection = database.getCollection('clients');
    const usersCollection = database.getCollection('users');
    const ticketsCollection = database.getCollection('tickets');
    const assetsCollection = database.getCollection('assets');

    // Check if client exists
    const client = await clientsCollection.findOne({ id: clientId });
    if (!client) {
      return res.status(404).json({ detail: 'Client not found' });
    }

    // Get current counts
    const [userCount, ticketCount, assetCount, openTicketCount, closedTicketCount] = await Promise.all([
      usersCollection.countDocuments({ client_id: clientId }),
      ticketsCollection.countDocuments({ client_id: clientId }),
      assetsCollection.countDocuments({ client_id: clientId }),
      ticketsCollection.countDocuments({ client_id: clientId, status: 'open' }),
      ticketsCollection.countDocuments({ client_id: clientId, status: 'closed' })
    ]);

    // Calculate total asset value
    const assetValueResult = await assetsCollection.aggregate([
      { $match: { client_id: clientId } },
      { 
        $group: { 
          _id: null, 
          totalValue: { 
            $sum: { 
              $cond: [
                { $and: [{ $ne: ["$value", null] }, { $ne: ["$value", ""] }] },
                { $toDouble: "$value" },
                0
              ]
            }
          } 
        } 
      }
    ]).toArray();

    const totalAssetValue = assetValueResult.length > 0 ? assetValueResult[0].totalValue : 0;

    const stats = {
      current_users: userCount,
      current_assets: assetCount,
      total_tickets: ticketCount,
      open_tickets: openTicketCount,
      closed_tickets: closedTicketCount,
      total_asset_value: totalAssetValue,
      user_limit: client.user_limit || 10,
      asset_limit: client.asset_limit || 50,
      user_limit_reached: userCount >= (client.user_limit || 10),
      asset_limit_reached: assetCount >= (client.asset_limit || 50)
    };

    res.json(stats);
  } catch (error) {
    logger.error('Error fetching client stats', { error: error.message, clientId: req.params.client_id });
    res.status(500).json({ detail: 'Failed to fetch client statistics' });
  }
});

// Update client (Superadmin only)
router.put('/:client_id', authenticate, requireSuperAdmin, async (req, res) => {
  try {
    const { name, contact_email, contact_phone, address, user_limit, asset_limit } = req.body;
    const clientsCollection = database.getCollection('clients');
    
    const client = await clientsCollection.findOne({ id: req.params.client_id });
    if (!client) {
      return res.status(404).json({ detail: 'Client not found' });
    }

    // Update client data
    const updateData = {};
    if (name) updateData.name = name;
    if (contact_email) updateData.contact_email = contact_email;
    if (contact_phone !== undefined) updateData.contact_phone = contact_phone;
    if (address !== undefined) updateData.address = address;
    if (user_limit) updateData.user_limit = user_limit;
    if (asset_limit) updateData.asset_limit = asset_limit;

    await clientsCollection.updateOne({ id: req.params.client_id }, { $set: updateData });
    res.json({ message: 'Client updated successfully' });
  } catch (error) {
    res.status(500).json({ detail: 'Failed to update client' });
  }
});

// Soft delete client (Superadmin only)
router.delete('/:client_id', authenticate, requireSuperAdmin, async (req, res) => {
  try {
    const clientsCollection = database.getCollection('clients');
    const client = await clientsCollection.findOne({ id: req.params.client_id });
    if (!client) {
      return res.status(404).json({ detail: 'Client not found' });
    }

    // Protect main organization
    if (client.code === '031210') {
      return res.status(403).json({ detail: 'Cannot delete the main organization' });
    }

    const clientId = req.params.client_id;

    // Get data counts for information
    const usersCollection = database.getCollection('users');
    const ticketsCollection = database.getCollection('tickets');
    const assetsCollection = database.getCollection('assets');
    const messagesCollection = database.getCollection('messages');
    const teamsCollection = database.getCollection('teams');
    const teamMessagesCollection = database.getCollection('team_messages');
    const firewallsCollection = database.getCollection('firewalls');
    const vendorsCollection = database.getCollection('vendors');
    const downtimesCollection = database.getCollection('downtimes');
    const serversCollection = database.getCollection('servers');
    const procurementsCollection = database.getCollection('procurements');

    const counts = await Promise.all([
      usersCollection.countDocuments({ client_id: clientId }),
      ticketsCollection.countDocuments({ client_id: clientId }),
      assetsCollection.countDocuments({ client_id: clientId }),
      messagesCollection.countDocuments({ client_id: clientId }),
      teamsCollection.countDocuments({ client_id: clientId }),
      teamMessagesCollection.countDocuments({ client_id: clientId }),
      firewallsCollection.countDocuments({ client_id: clientId }),
      vendorsCollection.countDocuments({ client_id: clientId }),
      downtimesCollection.countDocuments({ client_id: clientId }),
      serversCollection.countDocuments({ client_id: clientId }),
      procurementsCollection.countDocuments({ client_id: clientId })
    ]);

    const [userCount, ticketCount, assetCount, messageCount, teamCount, teamMessageCount,
           firewallCount, vendorCount, downtimeCount, serverCount, procurementCount] = counts;

    const totalRecords = counts.reduce((sum, count) => sum + count, 0);

    // Soft delete - mark as inactive
    await clientsCollection.updateOne(
      { id: clientId }, 
      { 
        $set: { 
          is_active: false, 
          deactivated_at: new Date(),
          updated_at: new Date()
        } 
      }
    );

    logger.info(`Client soft deleted: ${client.name} (${client.code})`, {
      clientId,
      totalRecords,
      dataCounts: {
        users: userCount,
        tickets: ticketCount,
        assets: assetCount,
        messages: messageCount,
        teams: teamCount,
        teamMessages: teamMessageCount,
        firewalls: firewallCount,
        vendors: vendorCount,
        downtimes: downtimeCount,
        servers: serverCount,
        procurements: procurementCount
      }
    });

    res.json({ 
      message: `Client "${client.name}" has been deactivated`,
      details: {
        client: {
          id: clientId,
          name: client.name,
          code: client.code
        },
        dataPreserved: {
          users: userCount,
          tickets: ticketCount,
          assets: assetCount,
          messages: messageCount,
          teams: teamCount,
          teamMessages: teamMessageCount,
          firewalls: firewallCount,
          vendors: vendorCount,
          downtimes: downtimeCount,
          servers: serverCount,
          procurements: procurementCount
        },
        totalRecordsPreserved: totalRecords
      },
      note: 'Client is deactivated but data is preserved. Use permanent delete to remove all data.'
    });
  } catch (error) {
    logger.error('Error soft deleting client', { 
      error: error.message, 
      clientId: req.params.client_id 
    });
    res.status(500).json({ detail: 'Failed to delete client' });
  }
});

// Permanently delete client (Superadmin only)
router.delete('/:client_id/permanent', authenticate, requireSuperAdmin, async (req, res) => {
  try {
    const clientsCollection = database.getCollection('clients');
    const client = await clientsCollection.findOne({ id: req.params.client_id });
    if (!client) {
      return res.status(404).json({ detail: 'Client not found' });
    }

    // Protect main organization
    if (client.code === '031210') {
      return res.status(403).json({ detail: 'Cannot delete the main organization' });
    }

    const clientId = req.params.client_id;

    logger.info(`Starting permanent deletion of client: ${client.name} (${client.code})`, { clientId });

    // Get all collections that contain client data
    const usersCollection = database.getCollection('users');
    const ticketsCollection = database.getCollection('tickets');
    const assetsCollection = database.getCollection('assets');
    const messagesCollection = database.getCollection('messages');
    const teamsCollection = database.getCollection('teams');
    const teamMessagesCollection = database.getCollection('team_messages');
    
    // Infrastructure collections
    const firewallsCollection = database.getCollection('firewalls');
    const vendorsCollection = database.getCollection('vendors');
    const downtimesCollection = database.getCollection('downtimes');
    const serversCollection = database.getCollection('servers');
    const procurementsCollection = database.getCollection('procurements');

    // Count existing data before deletion for logging
    const counts = await Promise.all([
      usersCollection.countDocuments({ client_id: clientId }),
      ticketsCollection.countDocuments({ client_id: clientId }),
      assetsCollection.countDocuments({ client_id: clientId }),
      messagesCollection.countDocuments({ client_id: clientId }),
      teamsCollection.countDocuments({ client_id: clientId }),
      teamMessagesCollection.countDocuments({ client_id: clientId }),
      firewallsCollection.countDocuments({ client_id: clientId }),
      vendorsCollection.countDocuments({ client_id: clientId }),
      downtimesCollection.countDocuments({ client_id: clientId }),
      serversCollection.countDocuments({ client_id: clientId }),
      procurementsCollection.countDocuments({ client_id: clientId })
    ]);

    const [userCount, ticketCount, assetCount, messageCount, teamCount, teamMessageCount, 
           firewallCount, vendorCount, downtimeCount, serverCount, procurementCount] = counts;

    logger.info(`Data to be deleted for client ${client.name}:`, {
      users: userCount,
      tickets: ticketCount,
      assets: assetCount,
      messages: messageCount,
      teams: teamCount,
      teamMessages: teamMessageCount,
      firewalls: firewallCount,
      vendors: vendorCount,
      downtimes: downtimeCount,
      servers: serverCount,
      procurements: procurementCount
    });

    // Delete all associated data in parallel for better performance
    const deleteResults = await Promise.all([
      usersCollection.deleteMany({ client_id: clientId }),
      ticketsCollection.deleteMany({ client_id: clientId }),
      assetsCollection.deleteMany({ client_id: clientId }),
      messagesCollection.deleteMany({ client_id: clientId }),
      teamsCollection.deleteMany({ client_id: clientId }),
      teamMessagesCollection.deleteMany({ client_id: clientId }),
      firewallsCollection.deleteMany({ client_id: clientId }),
      vendorsCollection.deleteMany({ client_id: clientId }),
      downtimesCollection.deleteMany({ client_id: clientId }),
      serversCollection.deleteMany({ client_id: clientId }),
      procurementsCollection.deleteMany({ client_id: clientId })
    ]);

    const totalDeleted = deleteResults.reduce((sum, result) => sum + result.deletedCount, 0);

    // Delete the client itself
    await clientsCollection.deleteOne({ id: clientId });

    logger.info(`Client deletion completed: ${client.name}`, {
      clientId,
      totalRecordsDeleted: totalDeleted,
      deletedCounts: {
        users: userCount,
        tickets: ticketCount,
        assets: assetCount,
        messages: messageCount,
        teams: teamCount,
        teamMessages: teamMessageCount,
        firewalls: firewallCount,
        vendors: vendorCount,
        downtimes: downtimeCount,
        servers: serverCount,
        procurements: procurementCount
      }
    });

    res.json({
      message: `Client "${client.name}" and all associated data permanently deleted`,
      details: {
        client: {
          id: clientId,
          name: client.name,
          code: client.code
        },
        deletedCounts: {
          users: userCount,
          tickets: ticketCount,
          assets: assetCount,
          messages: messageCount,
          teams: teamCount,
          teamMessages: teamMessageCount,
          firewalls: firewallCount,
          vendors: vendorCount,
          downtimes: downtimeCount,
          servers: serverCount,
          procurements: procurementCount
        },
        totalRecordsDeleted: totalDeleted
      },
      note: 'This action cannot be undone'
    });
  } catch (error) {
    logger.error('Error permanently deleting client', { 
      error: error.message, 
      clientId: req.params.client_id 
    });
    res.status(500).json({ detail: 'Failed to permanently delete client' });
  }
});

// Reactivate client (Superadmin only)
router.put('/:client_id/reactivate', authenticate, requireSuperAdmin, async (req, res) => {
  try {
    const clientsCollection = database.getCollection('clients');
    const client = await clientsCollection.findOne({ id: req.params.client_id });
    if (!client) {
      return res.status(404).json({ detail: 'Client not found' });
    }

    await clientsCollection.updateOne({ id: req.params.client_id }, { $set: { is_active: true } });

    res.json({ message: 'Client reactivated successfully' });
  } catch (error) {
    res.status(500).json({ detail: 'Failed to reactivate client' });
  }
});

// Update client user limit (Superadmin only)
router.put('/:client_id/user-limit', authenticate, requireSuperAdmin, [
  body('user_limit').isInt({ min: 1 }).withMessage('User limit must be a positive integer')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ detail: errors.array()[0].msg });
    }

    const clientId = req.params.client_id;
    const { user_limit } = req.body;
    const clientsCollection = database.getCollection('clients');
    const usersCollection = database.getCollection('users');

    // Check if client exists
    const client = await clientsCollection.findOne({ id: clientId });
    if (!client) {
      return res.status(404).json({ detail: 'Client not found' });
    }

    // Check current user count
    const currentUserCount = await usersCollection.countDocuments({ client_id: clientId });
    if (user_limit < currentUserCount) {
      return res.status(400).json({ 
        detail: `Cannot set user limit below current user count (${currentUserCount})` 
      });
    }

    await clientsCollection.updateOne(
      { id: clientId }, 
      { $set: { user_limit: user_limit, updated_at: new Date() } }
    );

    logger.info(`User limit updated for client ${client.name}: ${user_limit}`);
    res.json({ message: 'User limit updated successfully' });
  } catch (error) {
    logger.error('Error updating user limit', { error: error.message });
    res.status(500).json({ detail: 'Failed to update user limit' });
  }
});

// Update client asset limit (Superadmin only)
router.put('/:client_id/asset-limit', authenticate, requireSuperAdmin, [
  body('asset_limit').isInt({ min: 1 }).withMessage('Asset limit must be a positive integer')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ detail: errors.array()[0].msg });
    }

    const clientId = req.params.client_id;
    const { asset_limit } = req.body;
    const clientsCollection = database.getCollection('clients');
    const assetsCollection = database.getCollection('assets');

    // Check if client exists
    const client = await clientsCollection.findOne({ id: clientId });
    if (!client) {
      return res.status(404).json({ detail: 'Client not found' });
    }

    // Check current asset count
    const currentAssetCount = await assetsCollection.countDocuments({ client_id: clientId });
    if (asset_limit < currentAssetCount) {
      return res.status(400).json({ 
        detail: `Cannot set asset limit below current asset count (${currentAssetCount})` 
      });
    }

    await clientsCollection.updateOne(
      { id: clientId }, 
      { $set: { asset_limit: asset_limit, updated_at: new Date() } }
    );

    logger.info(`Asset limit updated for client ${client.name}: ${asset_limit}`);
    res.json({ message: 'Asset limit updated successfully' });
  } catch (error) {
    logger.error('Error updating asset limit', { error: error.message });
    res.status(500).json({ detail: 'Failed to update asset limit' });
  }
});

// Database cleanup endpoint (Superadmin only)
router.post('/cleanup-database', authenticate, requireSuperAdmin, async (req, res) => {
  try {
    const { performDatabaseCleanup } = require('../utils/database-cleanup');
    const result = await performDatabaseCleanup();
    
    logger.info('Manual database cleanup completed', result);
    res.json({
      message: 'Database cleanup completed successfully',
      result
    });
  } catch (error) {
    logger.error('Manual database cleanup failed', { error: error.message });
    res.status(500).json({ detail: 'Database cleanup failed: ' + error.message });
  }
});

module.exports = router;