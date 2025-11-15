const express = require('express');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { getSystemMetrics, getApiMetrics } = require('../middleware/monitoring');
const database = require('../config/database');
const logger = require('../utils/logger');

const router = express.Router();

// System health endpoint
router.get('/health', async (req, res) => {
  try {
    const metrics = await getSystemMetrics();
    const dbHealth = await database.healthCheck();
    
    const health = {
      status: dbHealth ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      ...metrics
    };

    res.status(dbHealth ? 200 : 503).json(health);
  } catch (error) {
    logger.error('Health check failed', { error: error.message });
    res.status(503).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Detailed metrics (admin only)
router.get('/metrics', authenticate, requireAdmin, async (req, res) => {
  try {
    const systemMetrics = await getSystemMetrics();
    const apiMetrics = getApiMetrics();
    
    // Database collection stats
    const collections = {};
    const collectionNames = ['clients', 'users', 'tickets', 'assets', 'messages'];
    
    for (const name of collectionNames) {
      try {
        const collection = database.getCollection(name);
        const count = await collection.countDocuments({ client_id: req.user.client_id });
        collections[name] = { count };
      } catch (error) {
        collections[name] = { error: error.message };
      }
    }

    res.json({
      system: systemMetrics,
      api: apiMetrics,
      database: {
        collections,
        health: await database.healthCheck()
      },
      client: {
        id: req.user.client_id,
        role: req.user.role
      }
    });
  } catch (error) {
    logger.error('Metrics collection failed', { error: error.message });
    res.status(500).json({ error: 'Failed to collect metrics' });
  }
});

// Performance alerts endpoint
router.get('/alerts', authenticate, requireAdmin, async (req, res) => {
  try {
    const systemMetrics = await getSystemMetrics();
    const alerts = [];

    // Memory usage alert (>80% of heap)
    const heapUsed = parseFloat(systemMetrics.memory.heapUsed);
    const heapTotal = parseFloat(systemMetrics.memory.heapTotal);
    if (heapUsed / heapTotal > 0.8) {
      alerts.push({
        type: 'memory',
        severity: 'warning',
        message: `High memory usage: ${((heapUsed / heapTotal) * 100).toFixed(1)}%`,
        timestamp: new Date().toISOString()
      });
    }

    // Database connection alert
    const dbHealth = await database.healthCheck();
    if (!dbHealth) {
      alerts.push({
        type: 'database',
        severity: 'critical',
        message: 'Database connection failed',
        timestamp: new Date().toISOString()
      });
    }

    // API error rate alerts
    const apiMetrics = getApiMetrics();
    for (const [endpoint, metrics] of Object.entries(apiMetrics)) {
      const errorRate = parseFloat(metrics.errorRate);
      if (errorRate > 10) {
        alerts.push({
          type: 'api',
          severity: 'warning',
          message: `High error rate on ${endpoint}: ${metrics.errorRate}`,
          timestamp: new Date().toISOString()
        });
      }
    }

    res.json({
      alerts,
      count: alerts.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Alerts collection failed', { error: error.message });
    res.status(500).json({ error: 'Failed to collect alerts' });
  }
});

// Audit log endpoint
router.get('/audit', authenticate, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 50, action, user_id } = req.query;
    const skip = (page - 1) * limit;

    // Build filter
    const filter = { client_id: req.user.client_id };
    if (action) filter.action = action;
    if (user_id) filter.user_id = user_id;

    // Get audit logs (we'll create this collection)
    const auditCollection = database.getCollection('audit_logs');
    const logs = await auditCollection
      .find(filter)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .toArray();

    const total = await auditCollection.countDocuments(filter);

    res.json({
      logs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error('Audit log retrieval failed', { error: error.message });
    res.status(500).json({ error: 'Failed to retrieve audit logs' });
  }
});

module.exports = router;