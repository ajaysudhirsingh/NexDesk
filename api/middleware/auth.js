const { verifyToken } = require('../utils/auth');
const database = require('../config/database');

// Authentication middleware
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ detail: 'Could not validate credentials' });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);

    if (!decoded) {
      return res.status(401).json({ detail: 'Could not validate credentials' });
    }

    // Find user in database
    const usersCollection = database.getCollection('users');
    const user = await usersCollection.findOne({
      username: decoded.sub,
      client_id: decoded.client_id
    });

    if (!user) {
      return res.status(401).json({ detail: 'Could not validate credentials' });
    }

    // Add user to request object
    req.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      client_id: user.client_id,
      setup_mode: decoded.setup_mode || false
    };

    next();
  } catch (error) {
    return res.status(401).json({ detail: 'Could not validate credentials' });
  }
};

// Admin authentication middleware
const requireAdmin = (req, res, next) => {
  if (!req.user || !['admin', 'superadmin'].includes(req.user.role)) {
    return res.status(403).json({ detail: 'Admin access required' });
  }
  next();
};

// Superadmin authentication middleware
const requireSuperAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'superadmin') {
    return res.status(403).json({ detail: 'Only superadmin can perform this action' });
  }
  next();
};

// Superadmin authentication middleware that allows setup mode
const requireSuperAdminOrSetup = (req, res, next) => {
  console.log('🔐 SuperAdmin middleware check:', {
    hasUser: !!req.user,
    role: req.user?.role,
    setupMode: req.user?.setup_mode
  });

  if (!req.user || req.user.role !== 'superadmin') {
    console.log('🔐 Access denied: Not superadmin');
    return res.status(403).json({ detail: 'Only superadmin can perform this action' });
  }
  
  // Allow superadmin access (2FA should be handled at login level)
  console.log('🔐 SuperAdmin access granted');
  next();
};

module.exports = {
  authenticate,
  requireAdmin,
  requireSuperAdmin,
  requireSuperAdminOrSetup
};