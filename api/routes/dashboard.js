const express = require('express');
const database = require('../config/database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Get role-based dashboard analytics
router.get('/analytics', authenticate, async (req, res) => {
  try {
    const ticketsCollection = database.getCollection('tickets');
    const assetsCollection = database.getCollection('assets');
    const usersCollection = database.getCollection('users');
    const baseQuery = { client_id: req.user.client_id };
    
    const isAdmin = ['admin', 'superadmin'].includes(req.user.role);
    
    let ticketQuery, assetQuery;
    
    if (isAdmin) {
      // Admin sees ALL data for their tenant
      ticketQuery = baseQuery;
      assetQuery = baseQuery;
    } else {
      // Regular user sees only THEIR data
      ticketQuery = {
        ...baseQuery,
        $or: [
          { created_by: req.user.id },
          { assigned_to: req.user.id }
        ]
      };
      assetQuery = {
        ...baseQuery,
        assigned_to: req.user.id
      };
    }

    // Calculate ticket statistics based on role
    const totalTickets = await ticketsCollection.countDocuments(ticketQuery);
    const openTickets = await ticketsCollection.countDocuments({ ...ticketQuery, status: 'open' });
    const inProgressTickets = await ticketsCollection.countDocuments({ ...ticketQuery, status: 'in_progress' });
    const closedTickets = await ticketsCollection.countDocuments({ ...ticketQuery, status: 'closed' });

    // Calculate asset statistics based on role
    const assets = await assetsCollection.find(assetQuery).toArray();
    const totalAssets = assets.length;
    const totalAssetValue = assets.reduce((sum, asset) => sum + (asset.value || 0), 0);

    // User statistics (only admins see this)
    const totalUsers = isAdmin ? await usersCollection.countDocuments({
      client_id: req.user.client_id,
      role: { $ne: 'superadmin' }
    }) : 0;

    // Get ticket categories (priority breakdown)
    const categories = {};
    for (const priority of ['high', 'medium', 'low']) {
      categories[priority] = await ticketsCollection.countDocuments({
        ...ticketQuery,
        priority
      });
    }

    // Recent activity based on role
    const recentTickets = await ticketsCollection.find(ticketQuery, {
      projection: {
        title: 1,
        status: 1,
        priority: 1,
        created_at: 1,
        created_by_username: 1,
        assigned_to_username: 1,
        _id: 0
      }
    }).sort({ created_at: -1 }).limit(5).toArray();

    res.json({
      total_tickets: totalTickets,
      open_tickets: openTickets,
      in_progress_tickets: inProgressTickets,
      closed_tickets: closedTickets,
      total_assets: totalAssets,
      total_asset_value: totalAssetValue,
      total_users: totalUsers,
      categories,
      recent_activity: recentTickets,
      is_admin: isAdmin,
      user_role: req.user.role,
      data_scope: isAdmin ? 'all_tenant_data' : 'user_specific_data',
      client_info: {
        client_id: req.user.client_id,
        user_role: req.user.role,
        username: req.user.username
      }
    });
  } catch (error) {
    console.error('Dashboard analytics error:', error);
    res.status(500).json({ detail: 'Failed to fetch dashboard analytics' });
  }
});

// Get comprehensive role-based dashboard data
router.get('/user-specific', authenticate, async (req, res) => {
  try {
    const ticketsCollection = database.getCollection('tickets');
    const assetsCollection = database.getCollection('assets');
    const usersCollection = database.getCollection('users');
    const baseQuery = { client_id: req.user.client_id };
    
    const isAdmin = ['admin', 'superadmin'].includes(req.user.role);

    const dashboardData = {
      user_info: {
        id: req.user.id,
        username: req.user.username,
        role: req.user.role,
        client_id: req.user.client_id,
        is_admin: isAdmin
      }
    };

    if (isAdmin) {
      // ADMIN VIEW: See ALL tenant data (merged view)
      dashboardData.admin_overview = {
        // All tickets in tenant
        total_tickets: await ticketsCollection.countDocuments(baseQuery),
        open_tickets: await ticketsCollection.countDocuments({ ...baseQuery, status: 'open' }),
        in_progress_tickets: await ticketsCollection.countDocuments({ ...baseQuery, status: 'in_progress' }),
        closed_tickets: await ticketsCollection.countDocuments({ ...baseQuery, status: 'closed' }),
        
        // Priority breakdown
        high_priority_tickets: await ticketsCollection.countDocuments({ ...baseQuery, priority: 'high' }),
        medium_priority_tickets: await ticketsCollection.countDocuments({ ...baseQuery, priority: 'medium' }),
        low_priority_tickets: await ticketsCollection.countDocuments({ ...baseQuery, priority: 'low' }),
        
        // Unassigned tickets
        unassigned_tickets: await ticketsCollection.countDocuments({
          ...baseQuery,
          assigned_to: null,
          status: { $ne: 'closed' }
        }),
        
        // All assets in tenant
        total_assets: await assetsCollection.countDocuments(baseQuery),
        total_asset_value: (await assetsCollection.find(baseQuery).toArray())
          .reduce((sum, asset) => sum + (asset.value || 0), 0),
        
        // All users in tenant
        total_users: await usersCollection.countDocuments({
          client_id: req.user.client_id,
          role: { $ne: 'superadmin' }
        }),
        
        // Recent activity across all tenant
        recent_activity: await ticketsCollection.find(baseQuery, {
          projection: {
            title: 1,
            status: 1,
            priority: 1,
            created_at: 1,
            created_by_username: 1,
            assigned_to_username: 1,
            _id: 0
          }
        }).sort({ created_at: -1 }).limit(10).toArray(),
        
        // Asset breakdown by status
        active_assets: await assetsCollection.countDocuments({ ...baseQuery, status: 'active' }),
        inactive_assets: await assetsCollection.countDocuments({ ...baseQuery, status: 'inactive' }),
        maintenance_assets: await assetsCollection.countDocuments({ ...baseQuery, status: 'maintenance' })
      };
    } else {
      // USER VIEW: See only THEIR OWN data
      const userTicketQuery = {
        ...baseQuery,
        $or: [
          { created_by: req.user.id },
          { assigned_to: req.user.id }
        ]
      };
      
      const userAssetQuery = {
        ...baseQuery,
        assigned_to: req.user.id
      };
      
      dashboardData.user_data = {
        // Only tickets created by or assigned to user
        my_tickets: await ticketsCollection.countDocuments(userTicketQuery),
        my_open_tickets: await ticketsCollection.countDocuments({ ...userTicketQuery, status: 'open' }),
        my_in_progress_tickets: await ticketsCollection.countDocuments({ ...userTicketQuery, status: 'in_progress' }),
        my_closed_tickets: await ticketsCollection.countDocuments({ ...userTicketQuery, status: 'closed' }),
        
        // Tickets created by user
        tickets_created_by_me: await ticketsCollection.countDocuments({
          ...baseQuery,
          created_by: req.user.id
        }),
        
        // Tickets assigned to user
        tickets_assigned_to_me: await ticketsCollection.countDocuments({
          ...baseQuery,
          assigned_to: req.user.id
        }),
        
        // Only assets assigned to user
        my_assets: await assetsCollection.countDocuments(userAssetQuery),
        my_asset_value: (await assetsCollection.find(userAssetQuery).toArray())
          .reduce((sum, asset) => sum + (asset.value || 0), 0),
        
        // Recent tickets related to user
        my_recent_activity: await ticketsCollection.find(userTicketQuery, {
          projection: {
            title: 1,
            status: 1,
            priority: 1,
            created_at: 1,
            created_by_username: 1,
            assigned_to_username: 1,
            _id: 0
          }
        }).sort({ created_at: -1 }).limit(5).toArray(),
        
        // User's asset breakdown
        my_active_assets: await assetsCollection.countDocuments({ ...userAssetQuery, status: 'active' }),
        my_inactive_assets: await assetsCollection.countDocuments({ ...userAssetQuery, status: 'inactive' }),
        my_maintenance_assets: await assetsCollection.countDocuments({ ...userAssetQuery, status: 'maintenance' })
      };
    }

    res.json(dashboardData);
  } catch (error) {
    console.error('User-specific dashboard error:', error);
    res.status(500).json({ detail: 'Failed to fetch user-specific dashboard data' });
  }
});

// Role-based stats endpoint
router.get('/stats', authenticate, async (req, res) => {
  try {
    const ticketsCollection = database.getCollection('tickets');
    const assetsCollection = database.getCollection('assets');
    const usersCollection = database.getCollection('users');
    const baseQuery = { client_id: req.user.client_id };
    
    const isAdmin = ['admin', 'superadmin'].includes(req.user.role);
    
    let ticketQuery, assetQuery;
    
    if (isAdmin) {
      // Admin sees all tenant data
      ticketQuery = baseQuery;
      assetQuery = baseQuery;
    } else {
      // User sees only their data
      ticketQuery = {
        ...baseQuery,
        $or: [
          { created_by: req.user.id },
          { assigned_to: req.user.id }
        ]
      };
      assetQuery = {
        ...baseQuery,
        assigned_to: req.user.id
      };
    }
    
    const stats = {
      total_tickets: await ticketsCollection.countDocuments(ticketQuery),
      open_tickets: await ticketsCollection.countDocuments({ ...ticketQuery, status: 'open' }),
      closed_tickets: await ticketsCollection.countDocuments({ ...ticketQuery, status: 'closed' }),
      total_assets: await assetsCollection.countDocuments(assetQuery),
      total_users: isAdmin ? await usersCollection.countDocuments({
        client_id: req.user.client_id,
        role: { $ne: 'superadmin' }
      }) : 0,
      is_admin: isAdmin,
      data_scope: isAdmin ? 'tenant_wide' : 'user_specific'
    };
    
    res.json(stats);
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ detail: 'Failed to fetch dashboard stats' });
  }
});

module.exports = router;