const database = require('../config/database');
const logger = require('./logger');

/**
 * Clean up orphaned admin users that don't have corresponding clients
 */
const cleanupOrphanedAdminUsers = async () => {
  try {
    const usersCollection = database.getCollection('users');
    const clientsCollection = database.getCollection('clients');
    
    // Find all admin users
    const adminUsers = await usersCollection.find({ role: 'admin' }).toArray();
    
    let orphanedCount = 0;
    
    for (const user of adminUsers) {
      // Check if client exists for this admin user
      const client = await clientsCollection.findOne({ id: user.client_id });
      
      if (!client) {
        // Remove orphaned admin user
        await usersCollection.deleteOne({ id: user.id });
        logger.info(`Removed orphaned admin user: ${user.username} (client_id: ${user.client_id})`);
        orphanedCount++;
      }
    }
    
    if (orphanedCount > 0) {
      logger.info(`Cleanup completed: Removed ${orphanedCount} orphaned admin users`);
    }
    
    return orphanedCount;
  } catch (error) {
    logger.error('Error during admin user cleanup', { error: error.message });
    throw error;
  }
};

/**
 * Remove duplicate admin users per client (keep one admin per client)
 */
const removeDuplicateAdminUsers = async () => {
  try {
    const usersCollection = database.getCollection('users');
    
    // Find clients with multiple admin users
    const duplicates = await usersCollection.aggregate([
      { $match: { role: 'admin' } },
      { $group: { _id: '$client_id', count: { $sum: 1 }, users: { $push: '$$ROOT' } } },
      { $match: { count: { $gt: 1 } } }
    ]).toArray();
    
    let removedCount = 0;
    
    for (const duplicate of duplicates) {
      // Sort by created_at and keep the most recent one per client
      const sortedUsers = duplicate.users.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      const usersToRemove = sortedUsers.slice(1); // Remove all except the first (most recent)
      
      for (const user of usersToRemove) {
        await usersCollection.deleteOne({ id: user.id });
        logger.info(`Removed duplicate admin user for client: ${user.client_id} (username: ${user.username})`);
        removedCount++;
      }
    }
    
    if (removedCount > 0) {
      logger.info(`Cleanup completed: Removed ${removedCount} duplicate admin users`);
    }
    
    return removedCount;
  } catch (error) {
    logger.error('Error during duplicate admin user cleanup', { error: error.message });
    throw error;
  }
};

/**
 * Comprehensive database cleanup
 */
const performDatabaseCleanup = async () => {
  try {
    logger.info('Starting database cleanup...');
    
    const orphanedCount = await cleanupOrphanedAdminUsers();
    const duplicateCount = await removeDuplicateAdminUsers();
    
    logger.info('Database cleanup completed', {
      orphanedUsersRemoved: orphanedCount,
      duplicateUsersRemoved: duplicateCount
    });
    
    return {
      orphanedUsersRemoved: orphanedCount,
      duplicateUsersRemoved: duplicateCount
    };
  } catch (error) {
    logger.error('Database cleanup failed', { error: error.message });
    throw error;
  }
};

module.exports = {
  cleanupOrphanedAdminUsers,
  removeDuplicateAdminUsers,
  performDatabaseCleanup
};