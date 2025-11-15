const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const logger = require('../utils/logger');

// CORS configuration
const corsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = process.env.CORS_ORIGINS?.split(',') || ['*'];
    
    // Allow requests with no origin (mobile apps, etc.)
    if (!origin) return callback(null, true);
    
    // Allow all origins if '*' is specified
    if (allowedOrigins.includes('*')) return callback(null, true);
    
    // Check if origin is in allowed list
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'X-Requested-With', 'Accept']
};

// Rate limiting - Ultra high traffic configuration for 1000+ concurrent users
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: parseInt(process.env.RATE_LIMIT_PER_MINUTE) || 100000, // 100,000 requests per minute
  message: { detail: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip rate limiting for health checks and common endpoints
  skip: (req) => {
    const skipPaths = ['/health', '/api/health', '/api/dashboard', '/api/tickets', '/api/users'];
    return skipPaths.some(path => req.url.startsWith(path));
  },
  // Use a more efficient store for high traffic
  keyGenerator: (req) => {
    return req.ip || 'anonymous';
  },
  // Don't count successful requests towards the limit
  skipSuccessfulRequests: false,
  // Don't count failed requests towards the limit
  skipFailedRequests: false
});

// More permissive rate limiting for auth endpoints to support high traffic
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // 1000 login attempts per 15 minutes per IP (much more permissive)
  message: { detail: 'Too many login attempts, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true // Don't count successful requests
});

// Request logging middleware
const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('Request completed', {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
  });
  
  next();
};

// Error handling middleware
const errorHandler = (err, req, res, next) => {
  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip
  });

  // Don't leak error details in production
  const message = process.env.NODE_ENV === 'production' 
    ? 'Internal server error' 
    : err.message;

  res.status(err.status || 500).json({
    detail: message,
    timestamp: new Date().toISOString()
  });
};

// Smart rate limiting that bypasses authenticated users
const smartLimiter = (req, res, next) => {
  // Skip rate limiting for authenticated users
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return next(); // Skip rate limiting for authenticated users
  }
  
  // Apply rate limiting only to unauthenticated requests
  return limiter(req, res, next);
};

// Setup all middleware
const setupMiddleware = (app) => {
  // Security middleware
  app.use(helmet({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: false
  }));
  
  // Compression
  app.use(compression());
  
  // CORS
  app.use(cors(corsOptions));
  
  // Smart rate limiting - Only for unauthenticated requests
  app.use(smartLimiter);
  
  // Very permissive rate limiting for auth endpoints
  app.use('/api/auth', authLimiter);
  
  // Request logging
  app.use(requestLogger);
  
  // Cookie parsing (required for sessions)
  app.use(require('cookie-parser')());
  
  // Body parsing
  app.use(require('express').json({ limit: '10mb' }));
  app.use(require('express').urlencoded({ extended: true, limit: '10mb' }));
  
  // Static files
  app.use('/uploads', require('express').static('uploads'));
};

module.exports = {
  setupMiddleware,
  errorHandler,
  corsOptions,
  authLimiter
};