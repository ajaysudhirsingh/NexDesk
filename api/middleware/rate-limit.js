const redisManager = require('../config/redis');
const logger = require('../utils/logger');

// Redis-based rate limiting
const createRateLimiter = (options = {}) => {
  const {
    windowMs = 60 * 1000, // 1 minute
    max = 100, // requests per window
    keyGenerator = (req) => req.ip,
    skipSuccessfulRequests = false,
    skipFailedRequests = false,
    message = 'Too many requests, please try again later',
    standardHeaders = true,
    legacyHeaders = false
  } = options;

  return async (req, res, next) => {
    try {
      if (!redisManager.isConnected) {
        // Fallback to in-memory rate limiting or skip if Redis is down
        logger.warn('Redis not connected, skipping rate limiting');
        return next();
      }

      const key = `rate_limit:${keyGenerator(req)}`;
      const window = Math.floor(Date.now() / windowMs);
      const windowKey = `${key}:${window}`;

      // Get current count
      const current = await redisManager.client.get(windowKey);
      const count = current ? parseInt(current) : 0;

      // Check if limit exceeded
      if (count >= max) {
        const resetTime = new Date((window + 1) * windowMs);
        
        // Set rate limit headers
        if (standardHeaders) {
          res.set('RateLimit-Limit', max);
          res.set('RateLimit-Remaining', 0);
          res.set('RateLimit-Reset', resetTime.toISOString());
        }
        
        if (legacyHeaders) {
          res.set('X-RateLimit-Limit', max);
          res.set('X-RateLimit-Remaining', 0);
          res.set('X-RateLimit-Reset', Math.ceil(resetTime.getTime() / 1000));
        }

        logger.warn('Rate limit exceeded', {
          key: keyGenerator(req),
          count,
          limit: max,
          window: windowMs,
          ip: req.ip,
          userAgent: req.get('User-Agent')
        });

        return res.status(429).json({
          error: 'Too Many Requests',
          message,
          retryAfter: Math.ceil((resetTime.getTime() - Date.now()) / 1000)
        });
      }

      // Increment counter
      const pipeline = redisManager.client.pipeline();
      pipeline.incr(windowKey);
      pipeline.expire(windowKey, Math.ceil(windowMs / 1000));
      await pipeline.exec();

      // Set rate limit headers
      const remaining = Math.max(0, max - count - 1);
      const resetTime = new Date((window + 1) * windowMs);
      
      if (standardHeaders) {
        res.set('RateLimit-Limit', max);
        res.set('RateLimit-Remaining', remaining);
        res.set('RateLimit-Reset', resetTime.toISOString());
      }
      
      if (legacyHeaders) {
        res.set('X-RateLimit-Limit', max);
        res.set('X-RateLimit-Remaining', remaining);
        res.set('X-RateLimit-Reset', Math.ceil(resetTime.getTime() / 1000));
      }

      // Skip counting for certain responses if configured
      const originalJson = res.json;
      res.json = function(data) {
        const shouldSkip = (skipSuccessfulRequests && res.statusCode < 400) ||
                          (skipFailedRequests && res.statusCode >= 400);
        
        if (shouldSkip) {
          // Decrement counter if we're skipping this request
          redisManager.client.decr(windowKey).catch(error => {
            logger.error('Failed to decrement rate limit counter', { 
              windowKey, 
              error: error.message 
            });
          });
        }
        
        return originalJson.call(this, data);
      };

      next();
    } catch (error) {
      logger.error('Rate limiting error', { error: error.message });
      // Continue without rate limiting if there's an error
      next();
    }
  };
};

// Predefined rate limiters
const rateLimiters = {
  // General API rate limiting
  api: createRateLimiter({
    windowMs: 60 * 1000, // 1 minute
    max: 1000, // 1000 requests per minute
    keyGenerator: (req) => {
      const userId = req.session?.data?.user?.id;
      return userId ? `user:${userId}` : `ip:${req.ip}`;
    }
  }),

  // Authentication endpoints (more permissive for development)
  auth: createRateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: process.env.NODE_ENV === 'production' ? 20 : 100, // 100 for dev, 20 for prod
    keyGenerator: (req) => `auth:${req.ip}`,
    message: 'Too many authentication attempts, please try again later',
    skipSuccessfulRequests: true // Don't count successful logins
  }),

  // Password reset
  passwordReset: createRateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // 3 password reset attempts per hour
    keyGenerator: (req) => `pwd_reset:${req.ip}`,
    message: 'Too many password reset attempts, please try again later'
  }),

  // File upload
  upload: createRateLimiter({
    windowMs: 60 * 1000, // 1 minute
    max: 10, // 10 uploads per minute
    keyGenerator: (req) => {
      const userId = req.session?.data?.user?.id;
      return userId ? `upload:user:${userId}` : `upload:ip:${req.ip}`;
    },
    message: 'Too many upload attempts, please try again later'
  }),

  // Search endpoints
  search: createRateLimiter({
    windowMs: 60 * 1000, // 1 minute
    max: 100, // 100 searches per minute
    keyGenerator: (req) => {
      const userId = req.session?.data?.user?.id;
      return userId ? `search:user:${userId}` : `search:ip:${req.ip}`;
    }
  }),

  // Admin endpoints
  admin: createRateLimiter({
    windowMs: 60 * 1000, // 1 minute
    max: 200, // 200 admin requests per minute
    keyGenerator: (req) => `admin:user:${req.session?.data?.user?.id || req.ip}`
  })
};

// Rate limit status checker
const getRateLimitStatus = async (key, windowMs, max) => {
  try {
    if (!redisManager.isConnected) {
      return null;
    }

    const window = Math.floor(Date.now() / windowMs);
    const windowKey = `rate_limit:${key}:${window}`;
    
    const current = await redisManager.client.get(windowKey);
    const count = current ? parseInt(current) : 0;
    const remaining = Math.max(0, max - count);
    const resetTime = new Date((window + 1) * windowMs);

    return {
      limit: max,
      remaining,
      reset: resetTime,
      count
    };
  } catch (error) {
    logger.error('Failed to get rate limit status', { key, error: error.message });
    return null;
  }
};

module.exports = {
  createRateLimiter,
  rateLimiters,
  getRateLimitStatus
};