const { MongoClient } = require('mongodb');
const logger = require('../utils/logger');

class DatabaseManager {
  constructor() {
    this.client = null;
    this.db = null;
    this.collections = {};
  }

  async connect() {
    try {
      const mongoUrl = process.env.MONGO_URL;
      const dbName = process.env.DB_NAME;
      
      if (!mongoUrl) {
        throw new Error('MONGO_URL environment variable is not set');
      }
      
      if (!dbName) {
        throw new Error('DB_NAME environment variable is not set');
      }
      
      // Use the connection string from .env
      const connectionString = mongoUrl;
      
      // SSL connection options for MongoDB Atlas (v4+ driver)
      const options = {
        tls: true,
        tlsInsecure: false,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        maxPoolSize: 10,
        retryWrites: true,
        w: 'majority'
      };
      
      this.client = new MongoClient(connectionString, options);
      await this.client.connect();
      
      // Test the connection
      await this.client.db('admin').command({ ping: 1 });
      
      this.db = this.client.db(dbName);
      
      // Initialize collections - exactly like Python version
      this.collections = {
        clients: this.db.collection('clients'),
        users: this.db.collection('users'),
        tickets: this.db.collection('tickets'),
        assets: this.db.collection('assets'),
        messages: this.db.collection('messages'),
        teams: this.db.collection('teams'),
        team_messages: this.db.collection('team_messages'),
        firewalls: this.db.collection('firewalls'),
        vendors: this.db.collection('vendors'),
        downtimes: this.db.collection('downtimes'),
        servers: this.db.collection('servers'),
        procurements: this.db.collection('procurements'),
        audit_logs: this.db.collection('audit_logs'),
        security_events: this.db.collection('security_events'),
        login_attempts: this.db.collection('login_attempts')
      };
      
      logger.info('Connected to MongoDB successfully', {
        url: mongoUrl,
        database: dbName
      });

      // Create indexes for better performance (skip if they exist)
      try {
        await this.createIndexes();
      } catch (indexError) {
        logger.warn('Some indexes already exist or failed to create', { error: indexError.message });
      }
      
      return this.client;
    } catch (error) {
      logger.error('Failed to connect to MongoDB', { error: error.message });
      throw error;
    }
  }

  async createIndexes() {
    try {
      // Users collection indexes - NO unique constraints on username/email, allow duplicates across clients
      // Only client_id should be indexed for performance, no uniqueness constraints
      
      // Drop existing conflicting indexes if they exist
      try {
        await this.collections.users.dropIndex('username_1');
      } catch (e) {
        // Index doesn't exist, that's fine
      }
      
      try {
        await this.collections.users.dropIndex('username_1_nonunique');
      } catch (e) {
        // Index doesn't exist, that's fine
      }
      
      // Drop existing conflicting email indexes if they exist
      try {
        await this.collections.users.dropIndex('email_1');
      } catch (e) {
        // Index doesn't exist, that's fine
      }
      
      try {
        await this.collections.users.dropIndex('email_1_nonunique');
      } catch (e) {
        // Index doesn't exist, that's fine
      }
      
      await this.collections.users.createIndex({ client_id: 1 });
      await this.collections.users.createIndex({ role: 1 });
      await this.collections.users.createIndex({ username: 1 }, { name: 'username_1_nonunique' }); // Non-unique index for performance
      await this.collections.users.createIndex({ email: 1 }, { name: 'email_1_nonunique' }); // Non-unique index for performance
      
      // Tickets collection indexes
      await this.collections.tickets.createIndex({ client_id: 1 });
      await this.collections.tickets.createIndex({ status: 1 });
      await this.collections.tickets.createIndex({ priority: 1 });
      await this.collections.tickets.createIndex({ assigned_to: 1 });
      await this.collections.tickets.createIndex({ created_by: 1 });
      await this.collections.tickets.createIndex({ created_at: -1 });
      await this.collections.tickets.createIndex({ closed_at: -1 });
      
      // Assets collection indexes
      await this.collections.assets.createIndex({ client_id: 1 });
      await this.collections.assets.createIndex({ asset_type: 1 });
      await this.collections.assets.createIndex({ assigned_to: 1 });
      await this.collections.assets.createIndex({ created_by: 1 });
      
      // Messages collection indexes
      await this.collections.messages.createIndex({ client_id: 1 });
      await this.collections.messages.createIndex({ sender_id: 1 });
      await this.collections.messages.createIndex({ recipient_id: 1 });
      await this.collections.messages.createIndex({ created_at: -1 });
      
      // Teams collection indexes
      await this.collections.teams.createIndex({ client_id: 1 });
      await this.collections.teams.createIndex({ manager_id: 1 });
      
      // Team messages collection indexes
      await this.collections.team_messages.createIndex({ team_id: 1 });
      await this.collections.team_messages.createIndex({ sender_id: 1 });
      await this.collections.team_messages.createIndex({ created_at: -1 });
      
      // Clients collection indexes
      await this.collections.clients.createIndex({ code: 1 }, { unique: true });
      await this.collections.clients.createIndex({ is_active: 1 });
      
      // Infrastructure collections indexes
      await this.collections.firewalls.createIndex({ client_id: 1 });
      await this.collections.firewalls.createIndex({ status: 1 });
      await this.collections.firewalls.createIndex({ license_expiry: 1 });
      
      await this.collections.vendors.createIndex({ client_id: 1 });
      await this.collections.vendors.createIndex({ status: 1 });
      await this.collections.vendors.createIndex({ contract_expiry: 1 });
      
      await this.collections.downtimes.createIndex({ client_id: 1 });
      await this.collections.downtimes.createIndex({ start_time: -1 });
      await this.collections.downtimes.createIndex({ system: 1 });
      
      await this.collections.servers.createIndex({ client_id: 1 });
      await this.collections.servers.createIndex({ status: 1 });
      await this.collections.servers.createIndex({ ip: 1 });
      
      await this.collections.procurements.createIndex({ client_id: 1 });
      await this.collections.procurements.createIndex({ status: 1 });
      await this.collections.procurements.createIndex({ request_date: -1 });
      
      logger.info('Database indexes created successfully');
    } catch (error) {
      logger.error('Failed to create database indexes', { error: error.message });
      throw error;
    }
  }

  async disconnect() {
    if (this.client) {
      await this.client.close();
      logger.info('Disconnected from MongoDB');
    }
  }

  async healthCheck() {
    try {
      if (!this.client) return false;
      
      // Ping the database - exactly like Python version
      await this.client.db('admin').command({ ping: 1 });
      return true;
    } catch (error) {
      logger.error('Database health check failed', { error: error.message });
      return false;
    }
  }

  // Get collection by name - matching Python interface
  getCollection(name) {
    return this.collections[name];
  }

  // Get database stats - for health check
  async getDbStats() {
    try {
      return await this.db.command({ dbStats: 1 });
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new DatabaseManager();