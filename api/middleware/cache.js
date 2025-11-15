const redisManager = require('../config/redis');
const logger = require('../utils/logger');
const crypto = require('crypto');

// Generate cache key from request
const generateCacheKey = (req, prefix = 'api') => {
  const { method, originalUrl, user } = req;
  const userId = req.session?.data?.user?.id || 'anonymous';
  const clientId = req.session?.data?.user?.client_id || 'default';
  
  // Include relevant headers for cache key
  const relevantHeaders = {
    'accept': req.headers.accept,
    'accept-language': req.headers['accept-language']
  };
  
  const keyData = {
    method,
    url: originalUrl,
    userId,
    clientId,
    headers: relevantHeaders
  };
  
  const hash = crypto.createHash('md5').update(JSON.stringify(keyData)).digest('hex');
  return `${prefix}:${hash}`;
};

// Cache middleware factory
const cacheMiddleware = (options = {}) => {
  const {
    ttl = 300, // 5 minutes default
    prefix = 'api_cache',
    skipCache = false,
    varyBy = [], // Additional fields to vary cache by
    condition = null // Function to determine if response should be cached
  } = options;

  return async (req, res, next) => {
    // Skip caching for non-GET requests or if Redis is not connected
    if (req.method !== 'GET' || skipCache || !redisManager.isConnected) {
      return next();
    }

    try {
      const cacheKey = generateCacheKey(req, prefix);
      
      // Try to get cached response
      const cachedResponse = await redisManager.get(cacheKey);
      
      if (cachedResponse) {
        logger.debug('Cache hit', { cacheKey, url: req.originalUrl });
        
        // Set cached headers
        if (cachedResponse.headers) {
          Object.entries(cachedResponse.headers).forEach(([key, value]) => {
            res.set(key, value);
          });
        }
        
        // Add cache headers
        res.set('X-Cache', 'HIT');
        res.set('X-Cache-Key', cacheKey);
        
        return res.status(cachedResponse.status || 200).json(cachedResponse.data);
      }

      // Cache miss - intercept response
      logger.debug('Cache miss', { cacheKey, url: req.originalUrl });
      
      const originalJson = res.json;
      const originalStatus = res.status;
      let responseStatus = 200;
      
      // Override status method to capture status code
      res.status = function(code) {
        responseStatus = code;
        return originalStatus.call(this, code);
      };
      
      // Override json method to cache response
      res.json = function(data) {
        // Only cache successful responses
        if (responseStatus >= 200 && responseStatus < 300) {
          // Check condition if provided
          if (!condition || condition(req, res, data)) {
            const responseToCache = {
              status: responseStatus,
              data: data,
              headers: {
                'content-type': 'application/json',
                'x-cache': 'MISS',
                'x-cache-key': cacheKey
              },
              timestamp: new Date().toISOString()
            };
            
            // Cache the response asynchronously
            redisManager.set(cacheKey, responseToCache, ttl).catch(error => {
              logger.error('Failed to cache response', { 
                cacheKey, 
                url: req.originalUrl, 
                error: error.message 
              });
            });
          }
        }
        
        // Add cache headers
        res.set('X-Cache', 'MISS');
        res.set('X-Cache-Key', cacheKey);
        
        return originalJson.call(this, data);
      };

      next();
    } catch (error) {
      logger.error('Cache middleware error', { 
        url: req.originalUrl, 
        error: error.message 
      });
      next();
    }
  };
};

// Cache invalidation helpers
const cacheInvalidation = {
  // Invalidate cache by pattern
  invalidatePattern: async (pattern) => {
    try {
      await redisManager.invalidatePattern(pattern);
      logger.info('Cache invalidated', { pattern });
    } catch (error) {
      logger.error('Cache invalidation failed', { pattern, error: error.message });
    }
  },

  // Invalidate user-specific cache
  invalidateUserCache: async (userId) => {
    const pattern = `api_cache:*${userId}*`;
    await cacheInvalidation.invalidatePattern(pattern);
  },

  // Invalidate client-specific cache
  invalidateClientCache: async (clientId) => {
    const pattern = `api_cache:*${clientId}*`;
    await cacheInvalidation.invalidatePattern(pattern);
  },

  // Invalidate specific endpoint cache
  invalidateEndpointCache: async (endpoint) => {
    const pattern = `api_cache:*${endpoint}*`;
    await cacheInvalidation.invalidatePattern(pattern);
  }
};

// Predefined cache configurations
const cacheConfigs = {
  // Short cache for frequently changing data
  short: cacheMiddleware({ ttl: 60, prefix: 'short_cache' }), // 1 minute
  
  // Medium cache for semi-static data
  medium: cacheMiddleware({ ttl: 300, prefix: 'medium_cache' }), // 5 minutes
  
  // Long cache for static data
  long: cacheMiddleware({ ttl: 3600, prefix: 'long_cache' }), // 1 hour
  
  // Dashboard cache with custom condition
  dashboard: cacheMiddleware({ 
    ttl: 180, 
    prefix: 'dashboard_cache',
    condition: (req, res, data) => {
      // Only cache if response has data
      return data && Object.keys(data).length > 0;
    }
  }),
  
  // User-specific cache
  user: cacheMiddleware({ 
    ttl: 600, 
    prefix: 'user_cache'
  })
};

module.exports = {
  cacheMiddleware,
  cacheInvalidation,
  cacheConfigs,
  generateCacheKey
};