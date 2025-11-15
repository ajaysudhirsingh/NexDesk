const express = require('express');
const database = require('../config/database');
const { authenticate, requireSuperAdmin } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

// Reset client system - Delete all data for a specific client
router.delete('/reset-system/:client_id', authenticate, requireSuperAdmin, async (req, res) => {
  try {
    const clientId = req.params.client_id;
    const clientsCollection = database.getCollection('clients');
    
    // Find the client
    const client = await clientsCollection.findOne({ id: clientId });
    if (!client) {
      return res.status(404).json({ detail: 'Client not found' });
    }

    // Protect main organization
    if (client.code === '031210') {
      return res.status(403).json({ detail: 'Cannot reset the main organization\'s system' });
    }

    logger.info(`Starting system reset for client: ${client.name} (${client.code})`);

    // Get all collections that need to be reset
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

    // Count existing data before deletion
    const counts = {
      users: await usersCollection.countDocuments({ client_id: clientId }),
      tickets: await ticketsCollection.countDocuments({ client_id: clientId }),
      assets: await assetsCollection.countDocuments({ client_id: clientId }),
      messages: await messagesCollection.countDocuments({ client_id: clientId }),
      teams: await teamsCollection.countDocuments({ client_id: clientId }),
      teamMessages: await teamMessagesCollection.countDocuments({ client_id: clientId }),
      firewalls: await firewallsCollection.countDocuments({ client_id: clientId }),
      vendors: await vendorsCollection.countDocuments({ client_id: clientId }),
      downtimes: await downtimesCollection.countDocuments({ client_id: clientId }),
      servers: await serversCollection.countDocuments({ client_id: clientId }),
      procurements: await procurementsCollection.countDocuments({ client_id: clientId })
    };

    // Delete all associated data
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

    // Reset client stats
    await clientsCollection.updateOne(
      { id: clientId },
      {
        $set: {
          stats: {
            total_tickets: 0,
            open_tickets: 0,
            closed_tickets: 0,
            total_assets: 0,
            total_asset_value: 0,
            total_users: 1 // Will be 1 after creating admin user
          },
          updated_at: new Date()
        }
      }
    );

    // Recreate default admin user
    const { hashPassword, generateUUID } = require('../utils/auth');
    const adminUser = {
      id: generateUUID(),
      username: 'admin',
      email: client.contact_email,
      password_hash: hashPassword('admin123'),
      role: 'admin',
      client_id: clientId,
      created_at: new Date()
    };

    await usersCollection.insertOne(adminUser);

    const totalDeleted = deleteResults.reduce((sum, result) => sum + result.deletedCount, 0);

    logger.info(`System reset completed for client: ${client.name}`, {
      clientId,
      clientCode: client.code,
      deletedCounts: counts,
      totalDeleted,
      adminRecreated: true
    });

    res.json({
      message: `System reset completed for client "${client.name}"`,
      details: {
        client: {
          id: clientId,
          name: client.name,
          code: client.code
        },
        deleted: counts,
        totalRecordsDeleted: totalDeleted,
        adminUserRecreated: {
          username: 'admin',
          password: 'admin123',
          email: client.contact_email
        }
      },
      note: 'All data has been permanently deleted and cannot be recovered'
    });

  } catch (error) {
    logger.error('Error resetting client system', { 
      error: error.message,
      clientId: req.params.client_id 
    });
    res.status(500).json({ detail: 'Failed to reset client system' });
  }
});

// Get system statistics for all clients
router.get('/system-stats', authenticate, requireSuperAdmin, async (req, res) => {
  try {
    const clientsCollection = database.getCollection('clients');
    const usersCollection = database.getCollection('users');
    const ticketsCollection = database.getCollection('tickets');
    const assetsCollection = database.getCollection('assets');

    const clients = await clientsCollection.find({}, { projection: { _id: 0 } }).toArray();
    
    const systemStats = await Promise.all(clients.map(async (client) => {
      const [userCount, ticketCount, assetCount] = await Promise.all([
        usersCollection.countDocuments({ client_id: client.id }),
        ticketsCollection.countDocuments({ client_id: client.id }),
        assetsCollection.countDocuments({ client_id: client.id })
      ]);

      return {
        ...client,
        actualStats: {
          users: userCount,
          tickets: ticketCount,
          assets: assetCount
        }
      };
    }));

    res.json(systemStats);
  } catch (error) {
    logger.error('Error fetching system stats', { error: error.message });
    res.status(500).json({ detail: 'Failed to fetch system statistics' });
  }
});

// Clean up orphaned data - Remove data that doesn't belong to any existing client
router.post('/cleanup-orphaned-data', authenticate, requireSuperAdmin, async (req, res) => {
  try {
    logger.info('Starting orphaned data cleanup...');
    
    const clientsCollection = database.getCollection('clients');
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

    // Get all valid client IDs
    const clients = await clientsCollection.find({}, { projection: { id: 1 } }).toArray();
    const validClientIds = clients.map(c => c.id);
    
    logger.info(`Found ${validClientIds.length} valid clients`);

    // Find and delete orphaned data
    const collections = [
      { name: 'users', collection: usersCollection },
      { name: 'tickets', collection: ticketsCollection },
      { name: 'assets', collection: assetsCollection },
      { name: 'messages', collection: messagesCollection },
      { name: 'teams', collection: teamsCollection },
      { name: 'team_messages', collection: teamMessagesCollection },
      { name: 'firewalls', collection: firewallsCollection },
      { name: 'vendors', collection: vendorsCollection },
      { name: 'downtimes', collection: downtimesCollection },
      { name: 'servers', collection: serversCollection },
      { name: 'procurements', collection: procurementsCollection }
    ];

    const cleanupResults = {};
    
    for (const { name, collection } of collections) {
      // Find orphaned records
      const orphanedCount = await collection.countDocuments({
        client_id: { $nin: validClientIds }
      });
      
      if (orphanedCount > 0) {
        // Delete orphaned records
        const deleteResult = await collection.deleteMany({
          client_id: { $nin: validClientIds }
        });
        
        cleanupResults[name] = {
          orphanedFound: orphanedCount,
          deleted: deleteResult.deletedCount
        };
        
        logger.info(`Cleaned up ${deleteResult.deletedCount} orphaned records from ${name}`);
      } else {
        cleanupResults[name] = {
          orphanedFound: 0,
          deleted: 0
        };
      }
    }

    const totalOrphaned = Object.values(cleanupResults).reduce((sum, result) => sum + result.orphanedFound, 0);
    const totalDeleted = Object.values(cleanupResults).reduce((sum, result) => sum + result.deleted, 0);

    logger.info(`Orphaned data cleanup completed. Total deleted: ${totalDeleted}`);

    res.json({
      message: 'Orphaned data cleanup completed',
      summary: {
        totalOrphanedFound: totalOrphaned,
        totalDeleted: totalDeleted,
        validClients: validClientIds.length
      },
      details: cleanupResults
    });

  } catch (error) {
    logger.error('Error cleaning up orphaned data', { error: error.message });
    res.status(500).json({ detail: 'Failed to cleanup orphaned data' });
  }
});

module.exports = router;