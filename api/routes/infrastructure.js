const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticate, requireAdmin } = require('../middleware/auth');

// Get infrastructure health data (Admin only)
router.get('/health', authenticate, requireAdmin, async (req, res) => {
  try {
    const { from, to } = req.query;
    const clientId = req.user.client_id;
    
    // Default date range (last 30 days)
    const fromDate = new Date(from || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
    const toDate = new Date(to || new Date());

    const ticketsCollection = db.getCollection('tickets');

    // Base query filter
    const baseFilter = {
      client_id: clientId,
      created_at: {
        $gte: fromDate,
        $lte: toDate
      }
    };

    // Get all tickets in date range
    const allTickets = await ticketsCollection.find(baseFilter).toArray();

    // Helper function to calculate hours between dates
    const getHoursDiff = (start, end) => {
      return Math.abs(new Date(end) - new Date(start)) / (1000 * 60 * 60);
    };

    // Helper function to check if text contains keywords (case insensitive)
    const containsKeywords = (text, keywords) => {
      const lowerText = text.toLowerCase();
      return keywords.some(keyword => lowerText.includes(keyword.toLowerCase()));
    };

    // Categorize tickets
    const categorizeTickets = (tickets) => {
      return tickets.map(ticket => {
        const title = ticket.title || '';
        const description = ticket.description || '';
        const closeComment = ticket.close_comment || '';
        
        let category = 'Normal';
        let vendor = 'Internal';
        
        // Check for outages
        if (containsKeywords(title + ' ' + description, ['outage', 'down', 'offline', 'unavailable'])) {
          category = 'Outage';
        }
        // Check for preventive maintenance
        else if (containsKeywords(title + ' ' + description, ['preventive', 'maintenance', 'scheduled'])) {
          category = 'Preventive';
        }
        // Check for changes
        else if (containsKeywords(title + ' ' + description, ['change', 'update', 'upgrade', 'migration'])) {
          category = 'Change';
        }
        
        // Determine vendor
        if (containsKeywords(title + ' ' + description, ['microsoft', 'office', 'windows', 'azure'])) {
          vendor = 'Microsoft';
        } else if (containsKeywords(title + ' ' + description, ['cisco', 'network'])) {
          vendor = 'Cisco';
        } else if (containsKeywords(title + ' ' + description, ['vmware', 'virtual'])) {
          vendor = 'VMware';
        } else if (containsKeywords(title + ' ' + description, ['dell', 'hardware'])) {
          vendor = 'Dell';
        } else if (containsKeywords(title + ' ' + description, ['adobe'])) {
          vendor = 'Adobe';
        } else if (containsKeywords(title + ' ' + description, ['oracle', 'database'])) {
          vendor = 'Oracle';
        } else if (containsKeywords(title + ' ' + description, ['aws', 'cloud'])) {
          vendor = 'AWS';
        }
        
        return {
          ...ticket,
          category,
          vendor,
          resolutionHours: ticket.status === 'closed' && ticket.updated_at ? 
            getHoursDiff(ticket.created_at, ticket.updated_at) : null
        };
      });
    };

    const categorizedTickets = categorizeTickets(allTickets);

    // 1. System Outage Impact Analysis - group by date
    const outageImpactMap = {};
    categorizedTickets.forEach(ticket => {
      const date = new Date(ticket.created_at).toISOString().split('T')[0];
      if (!outageImpactMap[date]) {
        outageImpactMap[date] = { date, outages: 0, tickets: 0, totalDuration: 0, count: 0 };
      }
      outageImpactMap[date].tickets++;
      if (ticket.category === 'Outage') {
        outageImpactMap[date].outages++;
        if (ticket.resolutionHours) {
          outageImpactMap[date].totalDuration += ticket.resolutionHours;
          outageImpactMap[date].count++;
        }
      }
    });

    const outageImpact = Object.values(outageImpactMap).map(day => ({
      ...day,
      duration: day.count > 0 ? Math.round(day.totalDuration / day.count) : 0,
      system: 'IT System'
    })).sort((a, b) => new Date(b.date) - new Date(a.date));

    // 2. Preventive vs Reactive Analysis
    const preventiveReactiveMap = {};
    categorizedTickets.forEach(ticket => {
      const date = new Date(ticket.created_at).toISOString().split('T')[0];
      if (!preventiveReactiveMap[date]) {
        preventiveReactiveMap[date] = { date, preventive: 0, reactive: 0 };
      }
      if (ticket.category === 'Preventive') {
        preventiveReactiveMap[date].preventive++;
      } else if (ticket.category !== 'Preventive') {
        preventiveReactiveMap[date].reactive++;
      }
    });

    const preventiveVsReactive = Object.values(preventiveReactiveMap)
      .sort((a, b) => new Date(b.date) - new Date(a.date));

    // 3. Change Management Impact
    const changeManagementMap = {};
    categorizedTickets.forEach(ticket => {
      if (ticket.category === 'Change') {
        const date = new Date(ticket.created_at).toISOString().split('T')[0];
        if (!changeManagementMap[date]) {
          changeManagementMap[date] = { date, successful: 0, failed: 0, tickets: 0 };
        }
        changeManagementMap[date].tickets++;
        
        if (ticket.status === 'closed') {
          const closeComment = (ticket.close_comment || '').toLowerCase();
          if (closeComment.includes('failed') || closeComment.includes('rollback')) {
            changeManagementMap[date].failed++;
          } else {
            changeManagementMap[date].successful++;
          }
        }
      }
    });

    const changeManagement = Object.values(changeManagementMap)
      .sort((a, b) => new Date(b.date) - new Date(a.date));

    // 4. Vendor Performance Analysis
    const vendorMap = {};
    categorizedTickets.forEach(ticket => {
      if (ticket.vendor !== 'Internal') {
        if (!vendorMap[ticket.vendor]) {
          vendorMap[ticket.vendor] = { vendor: ticket.vendor, tickets: 0, totalResolution: 0, count: 0 };
        }
        vendorMap[ticket.vendor].tickets++;
        if (ticket.resolutionHours) {
          vendorMap[ticket.vendor].totalResolution += ticket.resolutionHours;
          vendorMap[ticket.vendor].count++;
        }
      }
    });

    const vendorPerformance = Object.values(vendorMap).map(vendor => ({
      vendor: vendor.vendor,
      tickets: vendor.tickets,
      avgResolution: vendor.count > 0 ? Math.round(vendor.totalResolution / vendor.count) : 0
    })).sort((a, b) => b.tickets - a.tickets);

    // Calculate summary statistics
    const totalTickets = categorizedTickets.length;
    const outageTickets = categorizedTickets.filter(t => t.category === 'Outage').length;
    const preventiveTickets = categorizedTickets.filter(t => t.category === 'Preventive').length;
    const changeTickets = categorizedTickets.filter(t => t.category === 'Change').length;
    const vendorTickets = categorizedTickets.filter(t => t.vendor !== 'Internal').length;
    const normalTickets = totalTickets - outageTickets - preventiveTickets - changeTickets - vendorTickets;

    const totalOutages = outageImpact.reduce((sum, day) => sum + (day.outages || 0), 0);
    const preventivePercentage = totalTickets > 0 ? Math.round((preventiveTickets / totalTickets) * 100) : 0;
    
    const failedChanges = changeManagement.reduce((sum, day) => sum + (day.failed || 0), 0);
    const changeSuccessRate = changeTickets > 0 ? Math.round(((changeTickets - failedChanges) / changeTickets) * 100) : 0;
    
    const outageHours = categorizedTickets
      .filter(t => t.category === 'Outage' && t.resolutionHours)
      .reduce((sum, t) => sum + t.resolutionHours, 0);
    
    const vendorResolutionTimes = categorizedTickets
      .filter(t => t.vendor !== 'Internal' && t.resolutionHours)
      .map(t => t.resolutionHours);
    const avgVendorResolution = vendorResolutionTimes.length > 0 ? 
      Math.round(vendorResolutionTimes.reduce((sum, time) => sum + time, 0) / vendorResolutionTimes.length) : 0;

    res.json({
      outageImpact,
      preventiveVsReactive,
      changeManagement,
      vendorPerformance,
      summary: {
        totalTickets,
        totalOutages,
        outageTickets,
        preventiveTickets,
        changeTickets,
        vendorTickets,
        normalTickets: Math.max(0, normalTickets),
        outageHours: Math.round(outageHours),
        preventivePercentage,
        changeSuccessRate,
        avgVendorResolution
      }
    });

  } catch (error) {
    console.error('Error fetching infrastructure health data:', error);
    res.status(500).json({ error: 'Failed to fetch infrastructure health data' });
  }
});

// Export infrastructure health data (Admin only)
router.get('/export', authenticate, requireAdmin, async (req, res) => {
  try {
    const { from, to, format = 'csv' } = req.query;
    const clientId = req.user.client_id;
    
    const fromDate = new Date(from || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
    const toDate = new Date(to || new Date());

    const ticketsCollection = db.getCollection('tickets');

    // Get detailed infrastructure data for export
    const exportData = await ticketsCollection.find({
      client_id: clientId,
      created_at: {
        $gte: fromDate,
        $lte: toDate
      }
    }).sort({ created_at: -1 }).toArray();

    // Helper functions
    const containsKeywords = (text, keywords) => {
      const lowerText = text.toLowerCase();
      return keywords.some(keyword => lowerText.includes(keyword.toLowerCase()));
    };

    const getHoursDiff = (start, end) => {
      return Math.abs(new Date(end) - new Date(start)) / (1000 * 60 * 60);
    };

    // Categorize and format data
    const formattedData = exportData.map(ticket => {
      const title = ticket.title || '';
      const description = ticket.description || '';
      
      let category = 'Normal';
      let vendor = 'Internal';
      
      // Categorize
      if (containsKeywords(title + ' ' + description, ['outage', 'down', 'offline'])) {
        category = 'Outage';
      } else if (containsKeywords(title + ' ' + description, ['preventive', 'maintenance', 'scheduled'])) {
        category = 'Preventive';
      } else if (containsKeywords(title + ' ' + description, ['change', 'update', 'upgrade'])) {
        category = 'Change';
      }
      
      // Determine vendor
      if (containsKeywords(title + ' ' + description, ['microsoft', 'office', 'windows'])) {
        vendor = 'Microsoft';
      } else if (containsKeywords(title + ' ' + description, ['cisco', 'network'])) {
        vendor = 'Cisco';
      } else if (containsKeywords(title + ' ' + description, ['vmware', 'virtual'])) {
        vendor = 'VMware';
      } else if (containsKeywords(title + ' ' + description, ['dell', 'hardware'])) {
        vendor = 'Dell';
      } else if (containsKeywords(title + ' ' + description, ['adobe'])) {
        vendor = 'Adobe';
      } else if (containsKeywords(title + ' ' + description, ['oracle', 'database'])) {
        vendor = 'Oracle';
      } else if (containsKeywords(title + ' ' + description, ['aws', 'cloud'])) {
        vendor = 'AWS';
      }
      
      const resolutionHours = ticket.status === 'closed' && ticket.updated_at ? 
        Math.round(getHoursDiff(ticket.created_at, ticket.updated_at)) : null;
      
      return {
        id: ticket.id,
        title: ticket.title,
        description: ticket.description,
        priority: ticket.priority,
        status: ticket.status,
        created_at: ticket.created_at,
        updated_at: ticket.updated_at,
        category,
        vendor,
        resolution_hours: resolutionHours
      };
    });

    if (format === 'csv') {
      const csv = [
        'ID,Title,Description,Priority,Status,Created,Updated,Category,Vendor,Resolution Hours',
        ...formattedData.map(row => [
          row.id,
          `"${(row.title || '').replace(/"/g, '""')}"`,
          `"${(row.description || '').replace(/"/g, '""')}"`,
          row.priority,
          row.status,
          row.created_at,
          row.updated_at,
          row.category,
          row.vendor,
          row.resolution_hours || ''
        ].join(','))
      ].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="infrastructure-health-${fromDate.toISOString().slice(0, 10)}-to-${toDate.toISOString().slice(0, 10)}.csv"`);
      res.send(csv);
    } else if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="infrastructure-health-${fromDate.toISOString().slice(0, 10)}-to-${toDate.toISOString().slice(0, 10)}.json"`);
      res.json(formattedData);
    } else {
      res.status(400).json({ error: 'Unsupported format. Use csv or json.' });
    }

  } catch (error) {
    console.error('Error exporting infrastructure health data:', error);
    res.status(500).json({ error: 'Failed to export infrastructure health data' });
  }
});

// Get firewalls
router.get('/firewalls', authenticate, requireAdmin, async (req, res) => {
  try {
    const clientId = req.user.client_id;
    const firewallsCollection = db.getCollection('firewalls');
    
    const firewalls = await firewallsCollection.find({ client_id: clientId }).toArray();
    res.json(firewalls);
  } catch (error) {
    console.error('Error fetching firewalls:', error);
    res.status(500).json({ error: 'Failed to fetch firewalls' });
  }
});

// Add/Update firewall
router.post('/firewalls', authenticate, requireAdmin, async (req, res) => {
  try {
    const clientId = req.user.client_id;
    const firewallsCollection = db.getCollection('firewalls');
    
    const firewallData = {
      ...req.body,
      client_id: clientId,
      created_at: new Date(),
      updated_at: new Date()
    };
    
    if (req.body.id) {
      await firewallsCollection.updateOne(
        { id: req.body.id, client_id: clientId },
        { $set: { ...firewallData, updated_at: new Date() } }
      );
    } else {
      firewallData.id = `firewall_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      await firewallsCollection.insertOne(firewallData);
    }
    
    res.json({ success: true, message: 'Firewall saved successfully' });
  } catch (error) {
    console.error('Error saving firewall:', error);
    res.status(500).json({ error: 'Failed to save firewall' });
  }
});

// Get vendors
router.get('/vendors', authenticate, requireAdmin, async (req, res) => {
  try {
    const clientId = req.user.client_id;
    const vendorsCollection = db.getCollection('vendors');
    
    const vendors = await vendorsCollection.find({ client_id: clientId }).toArray();
    res.json(vendors);
  } catch (error) {
    console.error('Error fetching vendors:', error);
    res.status(500).json({ error: 'Failed to fetch vendors' });
  }
});

// Add/Update vendor
router.post('/vendors', authenticate, requireAdmin, async (req, res) => {
  try {
    const clientId = req.user.client_id;
    const vendorsCollection = db.getCollection('vendors');
    
    const vendorData = {
      ...req.body,
      client_id: clientId,
      created_at: new Date(),
      updated_at: new Date()
    };
    
    if (req.body.id) {
      await vendorsCollection.updateOne(
        { id: req.body.id, client_id: clientId },
        { $set: { ...vendorData, updated_at: new Date() } }
      );
    } else {
      vendorData.id = `vendor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      await vendorsCollection.insertOne(vendorData);
    }
    
    res.json({ success: true, message: 'Vendor saved successfully' });
  } catch (error) {
    console.error('Error saving vendor:', error);
    res.status(500).json({ error: 'Failed to save vendor' });
  }
});

// Get downtimes
router.get('/downtimes', authenticate, requireAdmin, async (req, res) => {
  try {
    const clientId = req.user.client_id;
    const downtimesCollection = db.getCollection('downtimes');
    
    const downtimes = await downtimesCollection.find({ client_id: clientId }).sort({ start_time: -1 }).toArray();
    res.json(downtimes);
  } catch (error) {
    console.error('Error fetching downtimes:', error);
    res.status(500).json({ error: 'Failed to fetch downtimes' });
  }
});

// Add/Update downtime
router.post('/downtimes', authenticate, requireAdmin, async (req, res) => {
  try {
    const clientId = req.user.client_id;
    const downtimesCollection = db.getCollection('downtimes');
    
    const downtimeData = {
      ...req.body,
      client_id: clientId,
      created_at: new Date(),
      updated_at: new Date()
    };
    
    if (req.body.id) {
      await downtimesCollection.updateOne(
        { id: req.body.id, client_id: clientId },
        { $set: { ...downtimeData, updated_at: new Date() } }
      );
    } else {
      downtimeData.id = `downtime_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      await downtimesCollection.insertOne(downtimeData);
    }
    
    res.json({ success: true, message: 'Downtime record saved successfully' });
  } catch (error) {
    console.error('Error saving downtime:', error);
    res.status(500).json({ error: 'Failed to save downtime record' });
  }
});

// Get servers
router.get('/servers', authenticate, requireAdmin, async (req, res) => {
  try {
    const clientId = req.user.client_id;
    const serversCollection = db.getCollection('servers');
    
    const servers = await serversCollection.find({ client_id: clientId }).toArray();
    res.json(servers);
  } catch (error) {
    console.error('Error fetching servers:', error);
    res.status(500).json({ error: 'Failed to fetch servers' });
  }
});

// Add/Update server
router.post('/servers', authenticate, requireAdmin, async (req, res) => {
  try {
    const clientId = req.user.client_id;
    const serversCollection = db.getCollection('servers');
    
    const serverData = {
      ...req.body,
      client_id: clientId,
      created_at: new Date(),
      updated_at: new Date()
    };
    
    if (req.body.id) {
      await serversCollection.updateOne(
        { id: req.body.id, client_id: clientId },
        { $set: { ...serverData, updated_at: new Date() } }
      );
    } else {
      serverData.id = `server_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      await serversCollection.insertOne(serverData);
    }
    
    res.json({ success: true, message: 'Server saved successfully' });
  } catch (error) {
    console.error('Error saving server:', error);
    res.status(500).json({ error: 'Failed to save server' });
  }
});

// Get procurements
router.get('/procurements', authenticate, requireAdmin, async (req, res) => {
  try {
    const clientId = req.user.client_id;
    const procurementsCollection = db.getCollection('procurements');
    
    const procurements = await procurementsCollection.find({ client_id: clientId }).sort({ request_date: -1 }).toArray();
    res.json(procurements);
  } catch (error) {
    console.error('Error fetching procurements:', error);
    res.status(500).json({ error: 'Failed to fetch procurements' });
  }
});

// Add/Update procurement
router.post('/procurements', authenticate, requireAdmin, async (req, res) => {
  try {
    const clientId = req.user.client_id;
    const procurementsCollection = db.getCollection('procurements');
    
    const procurementData = {
      ...req.body,
      client_id: clientId,
      created_at: new Date(),
      updated_at: new Date()
    };
    
    if (req.body.id) {
      await procurementsCollection.updateOne(
        { id: req.body.id, client_id: clientId },
        { $set: { ...procurementData, updated_at: new Date() } }
      );
    } else {
      procurementData.id = `procurement_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      await procurementsCollection.insertOne(procurementData);
    }
    
    res.json({ success: true, message: 'Procurement request saved successfully' });
  } catch (error) {
    console.error('Error saving procurement:', error);
    res.status(500).json({ error: 'Failed to save procurement request' });
  }
});

module.exports = router;