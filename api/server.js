require('dotenv').config();
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
const fs = require('fs');
const passport = require('./config/passport');

const database = require('./config/database');
const redisManager = require('./config/redis');
const { setupMiddleware, errorHandler } = require('./middleware');
const logger = require('./utils/logger');
const { hashPassword, generateUUID } = require('./utils/auth');

// Import routes
const authRoutes = require('./routes/auth');
const totpAuthRoutes = require('./routes/totp-auth');

const clientRoutes = require('./routes/clients');
const userRoutes = require('./routes/users');
const ticketRoutes = require('./routes/tickets');
const assetRoutes = require('./routes/assets');
const messageRoutes = require('./routes/messages');
const dashboardRoutes = require('./routes/dashboard');
const healthRoutes = require('./routes/health');
const teamRoutes = require('./routes/teams');
const exportRoutes = require('./routes/export');
const reportRoutes = require('./routes/reports');
const infrastructureRoutes = require('./routes/infrastructure');
const superadminRoutes = require('./routes/superadmin');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 8001;

// WebSocket Connection Manager for Teams Chat with Redis pub/sub
class TeamConnectionManager {
  constructor() {
    this.activeConnections = {};
    this.userConnections = {};
    this.subscriber = null;
    this.initializeRedisSubscriber();
  }

  async initializeRedisSubscriber() {
    try {
      if (redisManager.isConnected) {
        this.subscriber = redisManager.createSubscriber();
        if (this.subscriber) {
          this.subscriber.on('message', (channel, message) => {
            this.handleRedisMessage(channel, message);
          });
          await this.subscriber.subscribe('team_messages', 'user_notifications');
          logger.info('Redis subscriber initialized for WebSocket');
        }
      }
    } catch (error) {
      logger.error('Failed to initialize Redis subscriber', { error: error.message });
    }
  }

  handleRedisMessage(channel, message) {
    try {
      const data = JSON.parse(message);
      
      if (channel === 'team_messages') {
        this.broadcastToTeamLocal(data, data.team_id);
      } else if (channel === 'user_notifications') {
        this.sendToUserLocal(data, data.user_id);
      }
    } catch (error) {
      logger.error('Error handling Redis message', { channel, error: error.message });
    }
  }

  async connect(websocket, teamId, userId) {
    if (!this.activeConnections[teamId]) {
      this.activeConnections[teamId] = [];
    }
    this.activeConnections[teamId].push(websocket);
    this.userConnections[userId] = websocket;
    console.log(`User ${userId} connected to team ${teamId}`);
  }

  disconnect(websocket, teamId, userId) {
    if (this.activeConnections[teamId]) {
      const index = this.activeConnections[teamId].indexOf(websocket);
      if (index > -1) {
        this.activeConnections[teamId].splice(index, 1);
      }
      if (this.activeConnections[teamId].length === 0) {
        delete this.activeConnections[teamId];
      }
    }
    if (this.userConnections[userId]) {
      delete this.userConnections[userId];
    }
    console.log(`User ${userId} disconnected from team ${teamId}`);
  }

  async sendPersonalMessage(message, websocket) {
    if (websocket.readyState === WebSocket.OPEN) {
      websocket.send(message);
    }
  }

  async broadcastToTeam(message, teamId) {
    // Broadcast locally
    this.broadcastToTeamLocal(message, teamId);
    
    // Publish to Redis for other instances
    if (redisManager.isConnected) {
      await redisManager.publish('team_messages', { ...message, team_id: teamId });
    }
  }

  broadcastToTeamLocal(message, teamId) {
    if (this.activeConnections[teamId]) {
      const messageStr = JSON.stringify(message);
      this.activeConnections[teamId].forEach(connection => {
        try {
          if (connection.readyState === WebSocket.OPEN) {
            connection.send(messageStr);
          }
        } catch (error) {
          // Remove broken connections
          const index = this.activeConnections[teamId].indexOf(connection);
          if (index > -1) {
            this.activeConnections[teamId].splice(index, 1);
          }
        }
      });
    }
  }

  async sendToUser(message, userId) {
    // Send locally
    this.sendToUserLocal(message, userId);
    
    // Publish to Redis for other instances
    if (redisManager.isConnected) {
      await redisManager.publish('user_notifications', { ...message, user_id: userId });
    }
  }

  sendToUserLocal(message, userId) {
    const connection = this.userConnections[userId];
    if (connection && connection.readyState === WebSocket.OPEN) {
      connection.send(JSON.stringify(message));
    }
  }
}

const teamManager = new TeamConnectionManager();

// WebSocket server setup
const wss = new WebSocket.Server({ server });

wss.on('connection', async (ws, req) => {
  console.log('WebSocket connection established');
  
  try {
    // Parse the URL to get team ID and token
    const url = new URL(req.url, `http://${req.headers.host}`);
    const pathParts = url.pathname.split('/');
    
    // Check if this is a team WebSocket connection: /ws/teams/{team_id}
    if (pathParts[1] === 'ws' && pathParts[2] === 'teams' && pathParts[3]) {
      const teamId = pathParts[3];
      const token = url.searchParams.get('token');
      
      if (!token) {
        ws.close(1008, 'Token required');
        return;
      }
      
      // Verify token and get user
      const { verifyToken } = require('./utils/auth');
      const database = require('./config/database');
      
      try {
        const decoded = verifyToken(token);
        const usersCollection = database.getCollection('users');
        const user = await usersCollection.findOne({ 
          username: decoded.sub, 
          client_id: decoded.client_id 
        });
        
        if (!user) {
          ws.close(1008, 'Invalid token');
          return;
        }
        
        // Check if user is a member of the team
        const teamsCollection = database.getCollection('teams');
        const team = await teamsCollection.findOne({ 
          id: teamId, 
          client_id: user.client_id 
        });
        
        if (!team || !team.members.includes(user.id)) {
          ws.close(1008, 'Not a team member');
          return;
        }
        
        // Connect user to team
        await teamManager.connect(ws, teamId, user.id);
        
        ws.on('message', async (message) => {
          try {
            const data = JSON.parse(message);
            console.log('Received team WebSocket message:', data);
            
            // Handle different message types
            if (data.type === 'team_message') {
              // Broadcast message to all team members
              const messageData = {
                id: data.id,
                message: data.message,
                sender_id: user.id,
                sender_username: user.username,
                team_id: teamId,
                created_at: new Date().toISOString()
              };
              
              await teamManager.broadcastToTeam(messageData, teamId);
            }
          } catch (error) {
            console.error('WebSocket message error:', error);
          }
        });

        ws.on('close', () => {
          console.log(`Team WebSocket connection closed for user ${user.id} in team ${teamId}`);
          teamManager.disconnect(ws, teamId, user.id);
        });
        
      } catch (authError) {
        console.error('WebSocket authentication error:', authError);
        ws.close(1008, 'Authentication failed');
      }
    } else {
      // Handle other WebSocket connections (like regular chat)
      ws.on('message', (message) => {
        try {
          const data = JSON.parse(message);
          console.log('Received WebSocket message:', data);
        } catch (error) {
          console.error('WebSocket message error:', error);
        }
      });

      ws.on('close', () => {
        console.log('WebSocket connection closed');
      });
    }
  } catch (error) {
    console.error('WebSocket connection error:', error);
    ws.close(1011, 'Server error');
  }
});

// Create uploads directory if it doesn't exist - exactly matching Python
const UPLOADS_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Setup middleware
setupMiddleware(app);

// Redis-based middleware
const { sessionMiddleware } = require('./middleware/session');
const { rateLimiters } = require('./middleware/rate-limit');
const { cacheConfigs } = require('./middleware/cache');

// Apply session middleware (Redis-based) - exclude auth routes
const sessionMW = sessionMiddleware({
  sessionName: 'nexdesk_session',
  maxAge: 24 * 60 * 60 * 1000, // 24 hours
  secure: process.env.NODE_ENV === 'production'
});

// Apply session middleware conditionally (completely optional for performance)
app.use((req, res, next) => {
  // Skip session middleware entirely for now to improve performance
  // Can be re-enabled later when Redis is properly configured
  return next();
});

// Apply rate limiting middleware (only in production and if Redis is available)
app.use('/api/auth', (req, res, next) => {
  if (process.env.NODE_ENV === 'production' && redisManager.isConnected) {
    return rateLimiters.auth(req, res, next);
  }
  next();
});

app.use('/api', (req, res, next) => {
  // Skip general rate limiting for auth routes
  if (req.path.startsWith('/auth')) {
    return next();
  }
  
  // Only apply rate limiting if Redis is connected
  if (redisManager.isConnected) {
    return rateLimiters.api(req, res, next);
  }
  next();
});

// Enhanced security and monitoring middleware
const securityMiddleware = require('./middleware/security');
const { performanceMonitoring, errorTracking, metricsCollector } = require('./middleware/monitoring');
const { auditActions } = require('./middleware/audit');

// Apply security middleware
app.use(securityMiddleware.headers);
app.use(securityMiddleware.inputSanitizer);
app.use(securityMiddleware.suspiciousActivity);
app.use(securityMiddleware.loginTracking);

// Apply monitoring middleware
app.use(performanceMonitoring);
app.use(metricsCollector);

// Initialize Passport
app.use(passport.initialize());

// Swagger documentation (development only)
if (process.env.NODE_ENV !== 'production') {
  const { swaggerSetup } = require('./swagger/swagger');
  swaggerSetup(app);
}

// Static files - exactly matching Python version
app.use('/uploads', express.static(UPLOADS_DIR));

// Routes - exactly matching Python structure (no caching for auth)
app.use('/api/auth', auditActions.login, authRoutes);
app.use('/api/auth', totpAuthRoutes);

app.use('/api/clients', clientRoutes);
app.use('/api/users', userRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/assets', assetRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/infrastructure', infrastructureRoutes);
app.use('/api/superadmin', superadminRoutes);
app.use('/health', healthRoutes);
app.use('/api/health', healthRoutes);

// Monitoring and admin routes
const monitoringRoutes = require('./routes/monitoring');
app.use('/api/monitoring', monitoringRoutes);

// Root endpoint - exactly matching Python version
app.get('/', (req, res) => {
  res.json({
    name: 'NEXDESK API',
    version: '1.0.0',
    status: 'running',
    docs: process.env.NODE_ENV === 'development' ? '/docs' : null,
    health: '/health'
  });
});

// Global exception handler - exactly matching Python version
app.use((err, req, res, next) => {
  logger.error('Unhandled exception', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    client_ip: req.ip
  });

  res.status(err.status || 500).json({
    detail: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware (must be last)
app.use(errorTracking);
app.use(errorHandler);

// Fix username index to allow same username across different clients
// Initialize superadmin user - exactly matching Python version
const initializeSuperAdmin = async () => {
  try {
    const clientsCollection = database.getCollection('clients');
    const usersCollection = database.getCollection('users');
    
    // Check if superadmin client exists
    let client = await clientsCollection.findOne({ code: '031210' });
    
    if (!client) {
      client = {
        id: generateUUID(),
        name: 'Main Organization',
        code: '031210',
        contact_email: 'superadmin@nexdesk.com',
        contact_phone: null,
        address: null,
        user_limit: 100,
        asset_limit: 500,
        is_active: true,
        created_at: new Date(),
        stats: {
          total_tickets: 0,
          open_tickets: 0,
          closed_tickets: 0,
          total_assets: 0,
          total_asset_value: 0,
          total_users: 1
        }
      };
      await clientsCollection.insertOne(client);
      logger.info('Created main organization client with code: 031210');
    }
    
    // Check if superadmin user exists
    const existingSuperAdmin = await usersCollection.findOne({
      username: 'superadmin',
      client_id: client.id
    });
    
    if (!existingSuperAdmin) {
      const superAdmin = {
        id: generateUUID(),
        username: 'superadmin',
        email: 'ajaysudhirsingh@gmail.com',
        password_hash: hashPassword('superadmin123'),
        role: 'superadmin',
        client_id: client.id,
        totp_enabled: false,
        totp_secret: null,
        created_at: new Date()
      };
      await usersCollection.insertOne(superAdmin);
      logger.info('Created superadmin user: superadmin/superadmin123');
    } else {
      // Update existing superadmin with TOTP fields if they don't exist
      const updateFields = {};
      if (existingSuperAdmin.totp_enabled === undefined) {
        updateFields.totp_enabled = false;
      }
      if (existingSuperAdmin.totp_secret === undefined) {
        updateFields.totp_secret = null;
      }
      if (existingSuperAdmin.email !== 'ajaysudhirsingh@gmail.com') {
        updateFields.email = 'ajaysudhirsingh@gmail.com';
      }
      
      if (Object.keys(updateFields).length > 0) {
        updateFields.updated_at = new Date();
        await usersCollection.updateOne(
          { id: existingSuperAdmin.id },
          { $set: updateFields }
        );
        logger.info('Updated superadmin user with TOTP fields and email');
      }
    }
  } catch (error) {
    logger.error('Failed to initialize superadmin', { error: error.message });
  }
};

// Start server
const startServer = async () => {
  try {
    // Connect to database
    await database.connect();
    
    // Connect to Redis (non-blocking)
    redisManager.connect().catch(error => {
      logger.warn('Redis connection failed, continuing without Redis', { error: error.message });
    });
    
    // Perform database cleanup to remove orphaned/duplicate admin users
    const { performDatabaseCleanup } = require('./utils/database-cleanup');
    await performDatabaseCleanup();
    
    // Initialize superadmin if needed
    await initializeSuperAdmin();
    
    server.listen(PORT, () => {
      logger.info(`NEXDESK API server running on port ${PORT}`, {
        port: PORT,
        environment: process.env.NODE_ENV || 'development',
        database: process.env.DB_NAME,
        redis: redisManager.isConnected ? 'connected' : 'disconnected',
        instance_id: process.env.INSTANCE_ID || 'default'
      });
    });
  } catch (error) {
    logger.error('Failed to start server', { error: error.message });
    process.exit(1);
  }
};

// Graceful shutdown - exactly matching Python version
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  await Promise.all([
    database.disconnect(),
    redisManager.disconnect()
  ]);
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  await Promise.all([
    database.disconnect(),
    redisManager.disconnect()
  ]);
  process.exit(0);
});

// Start the server
startServer();

// Export for testing
module.exports = { app, server, teamManager };