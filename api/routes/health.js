const express = require('express');
const database = require('../config/database');
const redisManager = require('../config/redis');

const router = express.Router();

// Basic health check
router.get('/', async (req, res) => {
  try {
    const isHealthy = await database.healthCheck();
    
    if (!isHealthy) {
      return res.status(503).json({
        status: 'unhealthy',
        message: 'Database connection failed',
        timestamp: new Date().toISOString()
      });
    }

    // Check Redis health
    const redisHealthy = await redisManager.healthCheck();
    
    // Get some basic stats
    const teamsCollection = database.getCollection('teams');
    const teamMessagesCollection = database.getCollection('team_messages');
    const teamsCount = await teamsCollection.countDocuments();
    const teamMessagesCount = await teamMessagesCollection.countDocuments();

    res.json({
      status: 'healthy',
      message: 'NEXDESK API is running',
      timestamp: new Date().toISOString(),
      instance_id: process.env.INSTANCE_ID || 'default',
      database: 'connected',
      redis: redisHealthy ? 'connected' : 'disconnected',
      teams_count: teamsCount,
      team_messages_count: teamMessagesCount,
      services: {
        database: isHealthy,
        redis: redisHealthy,
        websocket: true
      }
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      message: 'Health check failed',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

// Detailed Redis health check
router.get('/redis', async (req, res) => {
  try {
    const isHealthy = await redisManager.healthCheck();
    
    if (!isHealthy) {
      return res.status(503).json({
        status: 'unhealthy',
        message: 'Redis connection failed',
        timestamp: new Date().toISOString(),
        connected: false
      });
    }

    // Get Redis info if connected
    let redisInfo = {};
    if (redisManager.isConnected && redisManager.client) {
      try {
        const info = await redisManager.client.info();
        const lines = info.split('\r\n');
        
        lines.forEach(line => {
          if (line.includes(':') && !line.startsWith('#')) {
            const [key, value] = line.split(':');
            redisInfo[key] = value;
          }
        });
      } catch (error) {
        redisInfo.error = 'Failed to get Redis info';
      }
    }

    res.json({
      status: 'healthy',
      message: 'Redis is connected and operational',
      timestamp: new Date().toISOString(),
      connected: true,
      info: {
        version: redisInfo.redis_version || 'unknown',
        mode: redisInfo.redis_mode || 'unknown',
        connected_clients: redisInfo.connected_clients || 'unknown',
        used_memory_human: redisInfo.used_memory_human || 'unknown',
        keyspace_hits: redisInfo.keyspace_hits || 'unknown',
        keyspace_misses: redisInfo.keyspace_misses || 'unknown'
      }
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      message: 'Redis health check failed',
      timestamp: new Date().toISOString(),
      connected: false,
      error: error.message
    });
  }
});

// Load balancer status endpoint
router.get('/lb-status', async (req, res) => {
  try {
    const dbHealthy = await database.healthCheck();
    const redisHealthy = await redisManager.healthCheck();
    
    const overallStatus = dbHealthy && redisHealthy ? 'healthy' : 'unhealthy';
    const statusCode = overallStatus === 'healthy' ? 200 : 503;
    
    res.status(statusCode).json({
      status: overallStatus,
      instance_id: process.env.INSTANCE_ID || 'default',
      timestamp: new Date().toISOString(),
      services: {
        database: dbHealthy,
        redis: redisHealthy,
        websocket: true
      },
      load_balancer_ready: overallStatus === 'healthy'
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      instance_id: process.env.INSTANCE_ID || 'default',
      timestamp: new Date().toISOString(),
      error: error.message,
      load_balancer_ready: false
    });
  }
});

module.exports = router;