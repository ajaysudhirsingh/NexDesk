const logger = require('../utils/logger');
const database = require('../config/database');

// Performance monitoring middleware
const performanceMonitoring = (req, res, next) => {
  const start = process.hrtime.bigint();
  const startMemory = process.memoryUsage();

  res.on('finish', () => {
    const end = process.hrtime.bigint();
    const endMemory = process.memoryUsage();
    
    const duration = Number(end - start) / 1000000; // Convert to milliseconds
    const memoryDelta = endMemory.heapUsed - startMemory.heapUsed;

    // Log performance metrics
    logger.info('Request performance', {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration.toFixed(2)}ms`,
      memoryDelta: `${(memoryDelta / 1024 / 1024).toFixed(2)}MB`,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
      userId: req.user?.id,
      clientId: req.user?.client_id
    });

    // Alert on slow requests (>5 seconds)
    if (duration > 5000) {
      logger.warn('Slow request detected', {
        method: req.method,
        url: req.url,
        duration: `${duration.toFixed(2)}ms`,
        userId: req.user?.id,
        clientId: req.user?.client_id
      });
    }

    // Alert on high memory usage (>100MB delta)
    if (memoryDelta > 100 * 1024 * 1024) {
      logger.warn('High memory usage detected', {
        method: req.method,
        url: req.url,
        memoryDelta: `${(memoryDelta / 1024 / 1024).toFixed(2)}MB`,
        userId: req.user?.id
      });
    }
  });

  next();
};

// Health check metrics
const getSystemMetrics = async () => {
  const memUsage = process.memoryUsage();
  const cpuUsage = process.cpuUsage();
  
  // Database metrics
  let dbMetrics = {};
  try {
    const dbStats = await database.getDbStats();
    dbMetrics = {
      collections: dbStats.collections,
      dataSize: dbStats.dataSize,
      indexSize: dbStats.indexSize,
      storageSize: dbStats.storageSize
    };
  } catch (error) {
    logger.error('Failed to get database metrics', { error: error.message });
  }

  return {
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: {
      rss: `${(memUsage.rss / 1024 / 1024).toFixed(2)}MB`,
      heapTotal: `${(memUsage.heapTotal / 1024 / 1024).toFixed(2)}MB`,
      heapUsed: `${(memUsage.heapUsed / 1024 / 1024).toFixed(2)}MB`,
      external: `${(memUsage.external / 1024 / 1024).toFixed(2)}MB`
    },
    cpu: {
      user: cpuUsage.user,
      system: cpuUsage.system
    },
    database: dbMetrics,
    nodeVersion: process.version,
    platform: process.platform,
    arch: process.arch
  };
};

// Error tracking middleware
const errorTracking = (err, req, res, next) => {
  // Enhanced error logging with context
  logger.error('Application error', {
    error: {
      message: err.message,
      stack: err.stack,
      name: err.name
    },
    request: {
      method: req.method,
      url: req.url,
      headers: req.headers,
      body: req.body,
      params: req.params,
      query: req.query
    },
    user: {
      id: req.user?.id,
      username: req.user?.username,
      role: req.user?.role,
      clientId: req.user?.client_id
    },
    timestamp: new Date().toISOString(),
    severity: err.status >= 500 ? 'critical' : 'warning'
  });

  // Send error to external monitoring service (placeholder)
  if (process.env.ERROR_TRACKING_URL) {
    // Integration with services like Sentry, Rollbar, etc.
    // sendToErrorTracking(err, req);
  }

  next(err);
};

// API metrics collection
const apiMetrics = {
  requests: new Map(),
  errors: new Map(),
  responseTime: new Map()
};

const metricsCollector = (req, res, next) => {
  const key = `${req.method} ${req.route?.path || req.url}`;
  const start = Date.now();

  // Increment request counter
  apiMetrics.requests.set(key, (apiMetrics.requests.get(key) || 0) + 1);

  res.on('finish', () => {
    const duration = Date.now() - start;
    
    // Track response times
    if (!apiMetrics.responseTime.has(key)) {
      apiMetrics.responseTime.set(key, []);
    }
    apiMetrics.responseTime.get(key).push(duration);

    // Track errors
    if (res.statusCode >= 400) {
      apiMetrics.errors.set(key, (apiMetrics.errors.get(key) || 0) + 1);
    }
  });

  next();
};

// Get API metrics summary
const getApiMetrics = () => {
  const metrics = {};
  
  for (const [endpoint, count] of apiMetrics.requests) {
    const errors = apiMetrics.errors.get(endpoint) || 0;
    const responseTimes = apiMetrics.responseTime.get(endpoint) || [];
    
    const avgResponseTime = responseTimes.length > 0 
      ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length 
      : 0;

    metrics[endpoint] = {
      requests: count,
      errors: errors,
      errorRate: count > 0 ? ((errors / count) * 100).toFixed(2) + '%' : '0%',
      avgResponseTime: `${avgResponseTime.toFixed(2)}ms`,
      maxResponseTime: responseTimes.length > 0 ? `${Math.max(...responseTimes)}ms` : '0ms'
    };
  }

  return metrics;
};

module.exports = {
  performanceMonitoring,
  getSystemMetrics,
  errorTracking,
  metricsCollector,
  getApiMetrics
};