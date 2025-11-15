const database = require('../config/database');
const logger = require('../utils/logger');
const { generateUUID } = require('../utils/auth');

// Audit logging middleware
const auditLogger = (action, resource = null) => {
  return async (req, res, next) => {
    const originalSend = res.send;
    
    res.send = function(data) {
      // Log the audit event
      logAuditEvent(req, res, action, resource, data);
      return originalSend.call(this, data);
    };

    next();
  };
};

// Log audit event to database
const logAuditEvent = async (req, res, action, resource, responseData) => {
  try {
    if (!req.user) return; // Skip if no authenticated user

    const auditLog = {
      id: generateUUID(),
      client_id: req.user.client_id,
      user_id: req.user.id,
      username: req.user.username,
      action,
      resource,
      resource_id: req.params.id || null,
      method: req.method,
      endpoint: req.originalUrl,
      ip_address: req.ip,
      user_agent: req.get('User-Agent'),
      request_body: sanitizeRequestBody(req.body),
      response_status: res.statusCode,
      timestamp: new Date(),
      session_id: req.sessionID || null,
      metadata: {
        query_params: req.query,
        route_params: req.params,
        success: res.statusCode < 400
      }
    };

    // Add resource-specific data
    if (responseData && typeof responseData === 'string') {
      try {
        const parsedData = JSON.parse(responseData);
        if (parsedData.id) {
          auditLog.resource_id = parsedData.id;
        }
      } catch (e) {
        // Ignore parsing errors
      }
    }

    const auditCollection = database.getCollection('audit_logs');
    await auditCollection.insertOne(auditLog);

    // Log critical actions
    if (isCriticalAction(action)) {
      logger.warn('Critical action performed', {
        user: req.user.username,
        action,
        resource,
        ip: req.ip,
        timestamp: new Date().toISOString()
      });
    }

  } catch (error) {
    logger.error('Audit logging failed', { 
      error: error.message,
      action,
      user: req.user?.username 
    });
  }
};

// Sanitize request body to remove sensitive data
const sanitizeRequestBody = (body) => {
  if (!body || typeof body !== 'object') return body;

  const sanitized = { ...body };
  const sensitiveFields = ['password', 'password_hash', 'token', 'secret', 'key'];
  
  for (const field of sensitiveFields) {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  }

  return sanitized;
};

// Check if action is critical
const isCriticalAction = (action) => {
  const criticalActions = [
    'user_delete',
    'client_delete',
    'admin_create',
    'password_reset',
    'role_change',
    'system_config_change',
    'data_export',
    'bulk_delete'
  ];
  
  return criticalActions.includes(action);
};

// Middleware for specific audit actions
const auditActions = {
  login: auditLogger('user_login', 'authentication'),
  logout: auditLogger('user_logout', 'authentication'),
  createUser: auditLogger('user_create', 'user'),
  updateUser: auditLogger('user_update', 'user'),
  deleteUser: auditLogger('user_delete', 'user'),
  createTicket: auditLogger('ticket_create', 'ticket'),
  updateTicket: auditLogger('ticket_update', 'ticket'),
  deleteTicket: auditLogger('ticket_delete', 'ticket'),
  createAsset: auditLogger('asset_create', 'asset'),
  updateAsset: auditLogger('asset_update', 'asset'),
  deleteAsset: auditLogger('asset_delete', 'asset'),
  assignAsset: auditLogger('asset_assign', 'asset'),
  createClient: auditLogger('client_create', 'client'),
  updateClient: auditLogger('client_update', 'client'),
  deleteClient: auditLogger('client_delete', 'client'),
  exportData: auditLogger('data_export', 'system'),
  configChange: auditLogger('system_config_change', 'system'),
  passwordReset: auditLogger('password_reset', 'user'),
  roleChange: auditLogger('role_change', 'user')
};

// Get audit statistics
const getAuditStats = async (clientId, days = 30) => {
  try {
    const auditCollection = database.getCollection('audit_logs');
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const pipeline = [
      {
        $match: {
          client_id: clientId,
          timestamp: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            action: '$action',
            date: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } }
          },
          count: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: '$_id.action',
          total: { $sum: '$count' },
          daily: {
            $push: {
              date: '$_id.date',
              count: '$count'
            }
          }
        }
      }
    ];

    const stats = await auditCollection.aggregate(pipeline).toArray();
    return stats;
  } catch (error) {
    logger.error('Failed to get audit stats', { error: error.message });
    return [];
  }
};

module.exports = {
  auditLogger,
  auditActions,
  getAuditStats,
  logAuditEvent
};