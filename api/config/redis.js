const Redis = require('ioredis');
const logger = require('../utils/logger');

class RedisManager {
  constructor() {
    this.client = null;
    this.isConnected = false;
  }

  async connect() {
    try {
      const redisConfig = {
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
        password: process.env.REDIS_PASSWORD || undefined,
        db: process.env.REDIS_DB || 0,
        retryDelayOnFailover: 100,
        maxRetriesPerRequest: 3,
        lazyConnect: true,
        keepAlive: 30000,
        connectTimeout: 10000,
        commandTimeout: 5000,
      };

      // Add cluster support for production
      if (process.env.REDIS_CLUSTER_NODES) {
        const nodes = process.env.REDIS_CLUSTER_NODES.split(',').map(node => {
          const [host, port] = node.trim().split(':');
          return { host, port: parseInt(port) };
        });
        
        this.client = new Redis.Cluster(nodes, {
          redisOptions: redisConfig,
          enableOfflineQueue: false,
        });
      } else {
        this.client = new Redis(redisConfig);
      }

      // Event handlers
      this.client.on('connect', () => {
        logger.info('Redis connected successfully');
        this.isConnected = true;
      });

      this.client.on('error', (error) => {
        logger.error('Redis connection error', { error: error.message });
        this.isConnected = false;
      });

      this.client.on('close', () => {
        logger.warn('Redis connection closed');
        this.isConnected = false;
      });

      this.client.on('reconnecting', () => {
        logger.info('Redis reconnecting...');
      });

      // Test connection
      await this.client.ping();
      logger.info('Redis connection established');

    } catch (error) {
      logger.error('Failed to connect to Redis', { error: error.message });
      // Don't throw error - allow app to run without Redis in development
      if (process.env.NODE_ENV === 'production') {
        throw error;
      }
    }
  }

  async disconnect() {
    if (this.client) {
      await this.client.quit();
      this.isConnected = false;
      logger.info('Redis disconnected');
    }
  }

  // Cache methods
  async get(key) {
    try {
      if (!this.isConnected) return null;
      const value = await this.client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error('Redis GET error', { key, error: error.message });
      return null;
    }
  }

  async set(key, value, ttl = 3600) {
    try {
      if (!this.isConnected) return false;
      const serialized = JSON.stringify(value);
      if (ttl) {
        await this.client.setex(key, ttl, serialized);
      } else {
        await this.client.set(key, serialized);
      }
      return true;
    } catch (error) {
      logger.error('Redis SET error', { key, error: error.message });
      return false;
    }
  }

  async del(key) {
    try {
      if (!this.isConnected) return false;
      await this.client.del(key);
      return true;
    } catch (error) {
      logger.error('Redis DEL error', { key, error: error.message });
      return false;
    }
  }

  async exists(key) {
    try {
      if (!this.isConnected) return false;
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      logger.error('Redis EXISTS error', { key, error: error.message });
      return false;
    }
  }

  // Session store methods
  async getSession(sessionId) {
    return await this.get(`session:${sessionId}`);
  }

  async setSession(sessionId, sessionData, ttl = 86400) {
    return await this.set(`session:${sessionId}`, sessionData, ttl);
  }

  async deleteSession(sessionId) {
    return await this.del(`session:${sessionId}`);
  }

  // Cache invalidation patterns
  async invalidatePattern(pattern) {
    try {
      if (!this.isConnected) return false;
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(...keys);
      }
      return true;
    } catch (error) {
      logger.error('Redis pattern invalidation error', { pattern, error: error.message });
      return false;
    }
  }

  // Health check
  async healthCheck() {
    try {
      if (!this.isConnected) return false;
      await this.client.ping();
      return true;
    } catch (error) {
      return false;
    }
  }

  // Pub/Sub for real-time features
  async publish(channel, message) {
    try {
      if (!this.isConnected) return false;
      await this.client.publish(channel, JSON.stringify(message));
      return true;
    } catch (error) {
      logger.error('Redis PUBLISH error', { channel, error: error.message });
      return false;
    }
  }

  createSubscriber() {
    if (!this.isConnected) return null;
    return this.client.duplicate();
  }
}

// Singleton instance
const redisManager = new RedisManager();

module.exports = redisManager;