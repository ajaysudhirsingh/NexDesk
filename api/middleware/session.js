const redisManager = require('../config/redis');
const { generateUUID } = require('../utils/auth');
const logger = require('../utils/logger');

// Redis-based session middleware
const sessionMiddleware = (options = {}) => {
  const {
    sessionName = 'nexdesk_session',
    maxAge = 24 * 60 * 60 * 1000, // 24 hours
    secure = process.env.NODE_ENV === 'production',
    httpOnly = true,
    sameSite = 'lax',
    fallbackToMemory = true // Fallback to in-memory sessions if Redis is unavailable
  } = options;

  // In-memory session store as fallback
  const memoryStore = new Map();

  return async (req, res, next) => {
    try {
      // Ensure cookies object exists
      if (!req.cookies) {
        req.cookies = {};
      }
      
      // Get session ID from cookie or create new one
      let sessionId = req.cookies[sessionName];
      
      if (!sessionId) {
        sessionId = generateUUID();
        res.cookie(sessionName, sessionId, {
          maxAge,
          secure,
          httpOnly,
          sameSite
        });
      }

      // Load session data from Redis or fallback to memory
      let sessionData = null;
      
      if (redisManager.isConnected) {
        sessionData = await redisManager.getSession(sessionId);
      } else if (fallbackToMemory) {
        sessionData = memoryStore.get(sessionId);
        logger.warn('Using in-memory session store (Redis unavailable)', { sessionId });
      }
      
      // Initialize session object
      req.session = {
        id: sessionId,
        data: sessionData || {},
        
        // Save session data to Redis or memory fallback
        save: async function() {
          try {
            if (redisManager.isConnected) {
              await redisManager.setSession(this.id, this.data, Math.floor(maxAge / 1000));
            } else if (fallbackToMemory) {
              memoryStore.set(this.id, this.data);
              // Set expiration for memory store
              setTimeout(() => {
                memoryStore.delete(this.id);
              }, maxAge);
            }
            return true;
          } catch (error) {
            logger.error('Failed to save session', { sessionId: this.id, error: error.message });
            // Try memory fallback if Redis fails
            if (fallbackToMemory && !memoryStore.has(this.id)) {
              memoryStore.set(this.id, this.data);
              setTimeout(() => {
                memoryStore.delete(this.id);
              }, maxAge);
            }
            return false;
          }
        },
        
        // Destroy session
        destroy: async function() {
          try {
            if (redisManager.isConnected) {
              await redisManager.deleteSession(this.id);
            }
            if (fallbackToMemory) {
              memoryStore.delete(this.id);
            }
            res.clearCookie(sessionName);
            this.data = {};
            return true;
          } catch (error) {
            logger.error('Failed to destroy session', { sessionId: this.id, error: error.message });
            // Still clear memory and cookie even if Redis fails
            if (fallbackToMemory) {
              memoryStore.delete(this.id);
            }
            res.clearCookie(sessionName);
            this.data = {};
            return false;
          }
        },
        
        // Regenerate session ID
        regenerate: async function() {
          const oldId = this.id;
          this.id = generateUUID();
          
          try {
            // Save with new ID
            await redisManager.setSession(this.id, this.data, Math.floor(maxAge / 1000));
            // Delete old session
            await redisManager.deleteSession(oldId);
            // Update cookie
            res.cookie(sessionName, this.id, {
              maxAge,
              secure,
              httpOnly,
              sameSite
            });
            return true;
          } catch (error) {
            logger.error('Failed to regenerate session', { oldId, newId: this.id, error: error.message });
            this.id = oldId; // Revert on error
            return false;
          }
        }
      };

      // Auto-save session on response end
      const originalEnd = res.end;
      res.end = function(...args) {
        req.session.save().catch(error => {
          logger.error('Auto-save session failed', { sessionId: req.session.id, error: error.message });
        });
        originalEnd.apply(this, args);
      };

      next();
    } catch (error) {
      logger.error('Session middleware error', { error: error.message });
      next(error);
    }
  };
};

// User session helpers
const userSession = {
  // Set user in session
  setUser: async (req, user) => {
    req.session.data.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      client_id: user.client_id,
      loginTime: new Date().toISOString()
    };
    await req.session.save();
  },

  // Get user from session
  getUser: (req) => {
    return req.session.data.user || null;
  },

  // Remove user from session
  clearUser: async (req) => {
    delete req.session.data.user;
    await req.session.save();
  },

  // Check if user is authenticated
  isAuthenticated: (req) => {
    return !!(req.session.data.user && req.session.data.user.id);
  },

  // Require authentication middleware
  requireAuth: (req, res, next) => {
    if (!userSession.isAuthenticated(req)) {
      return res.status(401).json({
        detail: 'Authentication required',
        code: 'AUTHENTICATION_REQUIRED'
      });
    }
    next();
  }
};

module.exports = {
  sessionMiddleware,
  userSession
};