const rateLimit = require('express-rate-limit');
const logger = require('../utils/logger');
const database = require('../config/database');

// Enhanced security middleware
const securityHeaders = (req, res, next) => {
  // Security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

  // Remove server information
  res.removeHeader('X-Powered-By');

  next();
};

// IP-based rate limiting with whitelist
const createAdvancedRateLimit = (options = {}) => {
  const {
    windowMs = 15 * 60 * 1000, // 15 minutes
    max = 100,
    message = 'Too many requests',
    skipWhitelist = true
  } = options;

  return rateLimit({
    windowMs,
    max,
    message: { detail: message },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
      // Skip rate limiting for whitelisted IPs
      if (skipWhitelist) {
        const whitelist = (process.env.IP_WHITELIST || '').split(',').map(ip => ip.trim());
        if (whitelist.includes(req.ip)) {
          return true;
        }
      }
      return false;
    },
    keyGenerator: (req) => {
      // Use combination of IP and user ID for authenticated requests
      return req.user ? `${req.ip}-${req.user.id}` : req.ip;
    },
    onLimitReached: (req, res, options) => {
      logger.warn('Rate limit exceeded', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        endpoint: req.originalUrl,
        userId: req.user?.id,
        timestamp: new Date().toISOString()
      });
    }
  });
};

// Suspicious activity detection
const suspiciousActivityDetector = async (req, res, next) => {
  try {
    const ip = req.ip;
    const userAgent = req.get('User-Agent');
    const endpoint = req.originalUrl;

    // Check for suspicious patterns
    const suspiciousPatterns = [
      /\b(union|select|insert|delete|drop|create|alter)\b/i, // SQL injection
      /<script|javascript:|vbscript:|onload|onerror/i, // XSS
      /\.\.\//g, // Path traversal
      /\b(eval|exec|system|shell_exec)\b/i // Code injection
    ];

    const requestData = JSON.stringify({
      url: endpoint,
      body: req.body,
      query: req.query,
      headers: req.headers
    });

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(requestData)) {
        logger.error('Suspicious activity detected', {
          ip,
          userAgent,
          endpoint,
          pattern: pattern.toString(),
          userId: req.user?.id,
          timestamp: new Date().toISOString(),
          severity: 'high'
        });

        // Log to security events collection
        const securityCollection = database.getCollection('security_events');
        await securityCollection.insertOne({
          type: 'suspicious_activity',
          ip,
          userAgent,
          endpoint,
          pattern: pattern.toString(),
          userId: req.user?.id || null,
          timestamp: new Date(),
          severity: 'high',
          blocked: false
        });

        // For now, just log - in production you might want to block
        break;
      }
    }

    next();
  } catch (error) {
    logger.error('Suspicious activity detection failed', { error: error.message });
    next();
  }
};

// Failed login attempt tracking
const loginAttemptTracker = async (req, res, next) => {
  const originalSend = res.send;

  res.send = async function (data) {
    if (req.originalUrl.includes('/login') && req.method === 'POST') {
      const ip = req.ip;
      const username = req.body.username;
      const success = res.statusCode === 200;

      try {
        const attemptsCollection = database.getCollection('login_attempts');

        await attemptsCollection.insertOne({
          ip,
          username,
          success,
          timestamp: new Date(),
          userAgent: req.get('User-Agent')
        });

        // Check for brute force attempts
        if (!success) {
          const recentAttempts = await attemptsCollection.countDocuments({
            $or: [{ ip }, { username }],
            success: false,
            timestamp: { $gte: new Date(Date.now() - 15 * 60 * 1000) } // Last 15 minutes
          });

          if (recentAttempts >= 5) {
            logger.warn('Potential brute force attack detected', {
              ip,
              username,
              attempts: recentAttempts,
              timestamp: new Date().toISOString()
            });

            // Log security event
            const securityCollection = database.getCollection('security_events');
            await securityCollection.insertOne({
              type: 'brute_force_attempt',
              ip,
              username,
              attempts: recentAttempts,
              timestamp: new Date(),
              severity: 'high',
              blocked: false
            });
          }
        }
      } catch (error) {
        logger.error('Login attempt tracking failed', { error: error.message });
      }
    }

    return originalSend.call(this, data);
  };

  next();
};

// Input validation and sanitization
const inputSanitizer = (req, res, next) => {
  // Sanitize string inputs
  const sanitizeString = (str) => {
    if (typeof str !== 'string') return str;

    // Remove potentially dangerous characters
    return str
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/vbscript:/gi, '')
      .replace(/onload|onerror|onclick/gi, '')
      .trim();
  };

  // Recursively sanitize object
  const sanitizeObject = (obj) => {
    if (obj === null || typeof obj !== 'object') {
      return typeof obj === 'string' ? sanitizeString(obj) : obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(sanitizeObject);
    }

    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
      sanitized[key] = sanitizeObject(value);
    }
    return sanitized;
  };

  // Sanitize request body and query
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }

  if (req.query) {
    req.query = sanitizeObject(req.query);
  }

  next();
};

// Security middleware collection
const securityMiddleware = {
  headers: securityHeaders,
  rateLimit: createAdvancedRateLimit,
  suspiciousActivity: suspiciousActivityDetector,
  loginTracking: loginAttemptTracker,
  inputSanitizer: inputSanitizer,

  // Predefined rate limiters
  strict: createAdvancedRateLimit({ max: 50, windowMs: 15 * 60 * 1000 }),
  moderate: createAdvancedRateLimit({ max: 100, windowMs: 15 * 60 * 1000 }),
  lenient: createAdvancedRateLimit({ max: 200, windowMs: 15 * 60 * 1000 }),

  // Auth-specific rate limiter
  auth: createAdvancedRateLimit({
    max: 10,
    windowMs: 15 * 60 * 1000,
    message: 'Too many authentication attempts'
  })
};

module.exports = securityMiddleware;