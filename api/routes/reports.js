const express = require('express');
const database = require('../config/database');
const { authenticate } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

// Role-based daily work report
router.get('/daily-work', authenticate, async (req, res) => {
  try {
    const start = req.query.start;
    const end = req.query.end;
    
    const ticketsCollection = database.getCollection('tickets');
    const isAdmin = ['admin', 'superadmin'].includes(req.user.role);
    
    // Role-based query construction
    let baseQuery;
    
    if (isAdmin) {
      // Admin sees ALL tickets for their tenant
      baseQuery = { client_id: req.user.client_id };
    } else {
      // Regular user sees only THEIR tickets
      baseQuery = {
        client_id: req.user.client_id,
        $or: [
          { created_by: req.user.id },
          { assigned_to: req.user.id }
        ]
      };
    }
    
    // Add date filter if provided
    if (start || end) {
      baseQuery.created_at = {};
      if (start) baseQuery.created_at.$gte = new Date(start);
      if (end) baseQuery.created_at.$lte = new Date(end);
    }
    
    const tickets = await ticketsCollection.find(baseQuery).toArray();
    
    // Calculate activity metrics
    const dailyWork = {};
    
    tickets.forEach(ticket => {
      const createdDate = ticket.created_at.toISOString().split('T')[0];
      
      // Initialize date entry if not exists
      if (!dailyWork[createdDate]) {
        dailyWork[createdDate] = { 
          raised: 0, 
          assigned: 0, 
          closed: 0,
          open: 0,
          in_progress: 0
        };
      }
      
      // Count tickets raised (created) on this date
      dailyWork[createdDate].raised += 1;
      
      // Count current status for pie chart
      dailyWork[createdDate][ticket.status] = (dailyWork[createdDate][ticket.status] || 0) + 1;
      
      // Count assignments (tickets created with assigned_to)
      if (ticket.assigned_to) {
        dailyWork[createdDate].assigned += 1;
      }
      
      // Count closures (if ticket is closed and has closed_at date)
      if (ticket.status === 'closed' && ticket.closed_at) {
        const closedDate = new Date(ticket.closed_at).toISOString().split('T')[0];
        if (!dailyWork[closedDate]) {
          dailyWork[closedDate] = { 
            raised: 0, 
            assigned: 0, 
            closed: 0,
            open: 0,
            in_progress: 0
          };
        }
        dailyWork[closedDate].closed += 1;
      }
    });
    
    // Convert to array format for charts
    const result = Object.entries(dailyWork).map(([date, data]) => ({
      date,
      ...data
    })).sort((a, b) => new Date(a.date) - new Date(b.date));
    
    res.json(result);
  } catch (error) {
    logger.error('Error generating daily work report', { error: error.message });
    res.status(500).json({ detail: 'Failed to generate daily work report' });
  }
});

// Agent performance report (Admin only)
router.get('/agent-performance', authenticate, async (req, res) => {
  try {
    // Only admins can see agent performance
    if (!['admin', 'superadmin'].includes(req.user.role)) {
      return res.status(403).json({ detail: 'Admin access required' });
    }
    
    const start = req.query.start;
    const end = req.query.end;
    
    const ticketsCollection = database.getCollection('tickets');
    const usersCollection = database.getCollection('users');
    
    const baseQuery = { client_id: req.user.client_id };
    
    // Add date filter if provided
    if (start || end) {
      baseQuery.created_at = {};
      if (start) baseQuery.created_at.$gte = new Date(start);
      if (end) baseQuery.created_at.$lte = new Date(end);
    }
    
    // Get all tickets for the client
    const tickets = await ticketsCollection.find(baseQuery).toArray();
    
    // Get all users (agents) for the client
    const agents = await usersCollection.find({
      client_id: req.user.client_id,
      role: { $in: ['user', 'admin', 'superadmin'] } // Include users, admins, and superadmins as potential agents
    }).toArray();
    
    // Calculate performance for each agent
    const agentPerformance = agents.map(agent => {
      const assignedTickets = tickets.filter(ticket => ticket.assigned_to === agent.id);
      const resolvedTickets = assignedTickets.filter(ticket => ticket.status === 'closed');
      
      return {
        agent_id: agent.id,
        agent_name: agent.username,
        assigned: assignedTickets.length,
        resolved: resolvedTickets.length,
        resolution_rate: assignedTickets.length > 0 ? Math.round((resolvedTickets.length / assignedTickets.length) * 100) : 0
      };
    }).filter(agent => agent.assigned > 0 || agent.resolved > 0); // Only include agents with tickets
    
    // Sort by total assigned tickets (most active first)
    agentPerformance.sort((a, b) => b.assigned - a.assigned);
    
    res.json(agentPerformance);
  } catch (error) {
    logger.error('Error generating agent performance report', { error: error.message });
    res.status(500).json({ detail: 'Failed to generate agent performance report' });
  }
});

// Role-based ticket priority volume
router.get('/ticket-priority-volume', authenticate, async (req, res) => {
  try {
    const start = req.query.start;
    const end = req.query.end;
    
    const ticketsCollection = database.getCollection('tickets');
    const isAdmin = ['admin', 'superadmin'].includes(req.user.role);
    
    // Role-based query construction
    let baseQuery;
    
    if (isAdmin) {
      // Admin sees ALL tickets for their tenant
      baseQuery = { client_id: req.user.client_id };
    } else {
      // Regular user sees only THEIR tickets
      baseQuery = {
        client_id: req.user.client_id,
        $or: [
          { created_by: req.user.id },
          { assigned_to: req.user.id }
        ]
      };
    }
    
    // Add date filter if provided
    if (start || end) {
      baseQuery.created_at = {};
      if (start) baseQuery.created_at.$gte = new Date(start);
      if (end) baseQuery.created_at.$lte = new Date(end);
    }
    
    const tickets = await ticketsCollection.find(baseQuery).toArray();
    
    // Group by priority
    const priorityVolume = { high: 0, medium: 0, low: 0 };
    tickets.forEach(ticket => {
      if (priorityVolume.hasOwnProperty(ticket.priority)) {
        priorityVolume[ticket.priority]++;
      }
    });
    
    // Convert to array format for charts
    const result = Object.entries(priorityVolume).map(([priority, count]) => ({
      priority,
      count
    }));
    
    res.json(result);
  } catch (error) {
    logger.error('Error generating priority volume report', { error: error.message });
    res.status(500).json({ detail: 'Failed to generate priority volume report' });
  }
});

// Role-based analytics report
router.get('/analytics', authenticate, async (req, res) => {
  try {
    const start = req.query.start;
    const end = req.query.end;
    
    const ticketsCollection = database.getCollection('tickets');
    const assetsCollection = database.getCollection('assets');
    const usersCollection = database.getCollection('users');
    
    const isAdmin = ['admin', 'superadmin'].includes(req.user.role);
    
    // Role-based query construction
    let ticketQuery, assetQuery;
    
    if (isAdmin) {
      // Admin sees ALL data for their tenant
      ticketQuery = { client_id: req.user.client_id };
      assetQuery = { client_id: req.user.client_id };
    } else {
      // Regular user sees only THEIR data
      ticketQuery = {
        client_id: req.user.client_id,
        $or: [
          { created_by: req.user.id },
          { assigned_to: req.user.id }
        ]
      };
      assetQuery = {
        client_id: req.user.client_id,
        assigned_to: req.user.id
      };
    }
    
    // Add date filter if provided
    if (start || end) {
      const dateFilter = {};
      if (start) dateFilter.$gte = new Date(start);
      if (end) dateFilter.$lte = new Date(end);
      ticketQuery.created_at = dateFilter;
    }
    
    // Get ticket statistics based on role
    const tickets = await ticketsCollection.find(ticketQuery).toArray();
    const ticketStats = {
      total: tickets.length,
      open: tickets.filter(t => t.status === 'open').length,
      in_progress: tickets.filter(t => t.status === 'in_progress').length,
      closed: tickets.filter(t => t.status === 'closed').length,
      high_priority: tickets.filter(t => t.priority === 'high').length,
      medium_priority: tickets.filter(t => t.priority === 'medium').length,
      low_priority: tickets.filter(t => t.priority === 'low').length
    };
    
    // Get asset statistics based on role
    const assets = await assetsCollection.find(assetQuery).toArray();
    const assetStats = {
      total: assets.length,
      total_value: assets.reduce((sum, asset) => sum + (asset.value || 0), 0),
      assigned: assets.filter(a => a.assigned_to).length,
      unassigned: assets.filter(a => !a.assigned_to).length
    };
    
    // Get user statistics (only admins see this)
    const userStats = {
      total: isAdmin ? await usersCollection.countDocuments({
        client_id: req.user.client_id,
        role: { $ne: 'superadmin' }
      }) : 0
    };
    
    res.json({
      tickets: ticketStats,
      assets: assetStats,
      users: userStats,
      period: { start, end },
      is_admin: isAdmin,
      data_scope: isAdmin ? 'all_tenant_data' : 'user_specific_data',
      user_role: req.user.role
    });
  } catch (error) {
    logger.error('Error generating analytics report', { error: error.message });
    res.status(500).json({ detail: 'Failed to generate analytics report' });
  }
});

// Overview report (Admin only)
router.get('/overview', authenticate, async (req, res) => {
  try {
    if (!['admin', 'superadmin'].includes(req.user.role)) {
      return res.status(403).json({ detail: 'Admin access required' });
    }
    
    const start = req.query.start;
    const end = req.query.end;
    
    const ticketsCollection = database.getCollection('tickets');
    const assetsCollection = database.getCollection('assets');
    const usersCollection = database.getCollection('users');
    
    let baseQuery = {};
    
    if (req.user.role === 'admin') {
      baseQuery.client_id = req.user.client_id;
    }
    // Superadmin can see all data (no client filter)
    
    // Add date filter if provided
    if (start || end) {
      baseQuery.created_at = {};
      if (start) baseQuery.created_at.$gte = new Date(start);
      if (end) baseQuery.created_at.$lte = new Date(end);
    }
    
    const tickets = await ticketsCollection.find(baseQuery).toArray();
    const assets = await assetsCollection.find(
      req.user.role === 'admin' ? { client_id: req.user.client_id } : {}
    ).toArray();
    
    const userQuery = req.user.role === 'admin' 
      ? { client_id: req.user.client_id, role: { $ne: 'superadmin' } }
      : { role: { $ne: 'superadmin' } };
    
    const totalUsers = await usersCollection.countDocuments(userQuery);
    
    // Calculate trends and statistics
    const overview = {
      summary: {
        total_tickets: tickets.length,
        open_tickets: tickets.filter(t => t.status === 'open').length,
        closed_tickets: tickets.filter(t => t.status === 'closed').length,
        total_assets: assets.length,
        total_users: totalUsers
      },
      trends: {
        tickets_by_priority: {
          high: tickets.filter(t => t.priority === 'high').length,
          medium: tickets.filter(t => t.priority === 'medium').length,
          low: tickets.filter(t => t.priority === 'low').length
        },
        tickets_by_status: {
          open: tickets.filter(t => t.status === 'open').length,
          in_progress: tickets.filter(t => t.status === 'in_progress').length,
          closed: tickets.filter(t => t.status === 'closed').length
        }
      },
      period: { start, end }
    };
    
    res.json(overview);
  } catch (error) {
    logger.error('Error generating overview report', { error: error.message });
    res.status(500).json({ detail: 'Failed to generate overview report' });
  }
});

// Asset distribution report
router.get('/asset-distribution', authenticate, async (req, res) => {
  try {
    const assetsCollection = database.getCollection('assets');
    const isAdmin = ['admin', 'superadmin'].includes(req.user.role);
    
    let baseQuery;
    if (isAdmin) {
      baseQuery = { client_id: req.user.client_id };
    } else {
      baseQuery = { 
        client_id: req.user.client_id,
        assigned_to: req.user.id 
      };
    }
    
    const assets = await assetsCollection.find(baseQuery).toArray();
    
    // Group by asset type
    const distribution = {};
    assets.forEach(asset => {
      const type = asset.asset_type || 'Other';
      distribution[type] = (distribution[type] || 0) + 1;
    });
    
    // Convert to array format
    const result = {
      by_type: {
        labels: Object.keys(distribution),
        values: Object.values(distribution)
      },
      total_assets: assets.length,
      total_value: assets.reduce((sum, asset) => sum + (asset.value || 0), 0)
    };
    
    res.json(result);
  } catch (error) {
    logger.error('Error generating asset distribution report', { error: error.message });
    res.status(500).json({ detail: 'Failed to generate asset distribution report' });
  }
});

// Ticket status report
router.get('/ticket-status', authenticate, async (req, res) => {
  try {
    const start = req.query.start;
    const end = req.query.end;
    
    const ticketsCollection = database.getCollection('tickets');
    const isAdmin = ['admin', 'superadmin'].includes(req.user.role);
    
    let baseQuery;
    if (isAdmin) {
      baseQuery = { client_id: req.user.client_id };
    } else {
      baseQuery = {
        client_id: req.user.client_id,
        $or: [
          { created_by: req.user.id },
          { assigned_to: req.user.id }
        ]
      };
    }
    
    // Add date filter if provided
    if (start || end) {
      baseQuery.created_at = {};
      if (start) baseQuery.created_at.$gte = new Date(start);
      if (end) baseQuery.created_at.$lte = new Date(end);
    }
    
    const tickets = await ticketsCollection.find(baseQuery).toArray();
    
    // Count by status
    const statusCounts = {
      open: tickets.filter(t => t.status === 'open').length,
      in_progress: tickets.filter(t => t.status === 'in_progress').length,
      closed: tickets.filter(t => t.status === 'closed').length
    };
    
    const result = {
      labels: Object.keys(statusCounts),
      values: Object.values(statusCounts),
      total: tickets.length
    };
    
    res.json(result);
  } catch (error) {
    logger.error('Error generating ticket status report', { error: error.message });
    res.status(500).json({ detail: 'Failed to generate ticket status report' });
  }
});

module.exports = router;