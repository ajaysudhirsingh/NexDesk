const express = require('express');
const database = require('../config/database');
const { authenticate, requireAdmin } = require('../middleware/auth');
const logger = require('../utils/logger');
const ExcelJS = require('exceljs');
const puppeteer = require('puppeteer');

const router = express.Router();

// Helper function to generate PDF from HTML
const generatePDF = async (htmlContent, title) => {
  let browser;
  try {
    console.log('Launching browser for PDF generation...');
    browser = await puppeteer.launch({ 
      headless: 'new',
      args: [
        '--no-sandbox', 
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu'
      ]
    });
    
    const page = await browser.newPage();
    console.log('Browser page created');
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${title}</title>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; word-wrap: break-word; }
          th { background-color: #f2f2f2; font-weight: bold; }
          h1 { color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px; }
          .header { text-align: center; margin-bottom: 30px; }
          .timestamp { color: #666; font-size: 12px; }
          .status-badge { padding: 2px 8px; border-radius: 12px; font-size: 12px; display: inline-block; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${title}</h1>
          <p class="timestamp">Generated on: ${new Date().toLocaleString()}</p>
        </div>
        ${htmlContent}
      </body>
      </html>
    `;
    
    await page.setContent(html, { waitUntil: 'networkidle0' });
    console.log('HTML content loaded');
    
    const pdf = await page.pdf({ 
      format: 'A4', 
      printBackground: true,
      margin: { top: '20px', bottom: '20px', left: '20px', right: '20px' },
      timeout: 30000
    });
    
    console.log('PDF generated successfully, size:', pdf.length, 'bytes');
    return pdf;
    
  } catch (error) {
    console.error('PDF generation error:', error.message);
    throw new Error(`PDF generation failed: ${error.message}`);
  } finally {
    if (browser) {
      await browser.close();
      console.log('Browser closed');
    }
  }
};

// Helper function to generate Excel file
const generateExcel = async (data, columns, sheetName) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(sheetName);
  
  // Add headers
  worksheet.addRow(columns.map(col => col.header));
  
  // Style headers
  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE6F3FF' }
  };
  
  // Add data rows
  data.forEach(item => {
    const row = columns.map(col => {
      const value = item[col.key];
      if (value instanceof Date) {
        return value.toLocaleString();
      }
      return value || '';
    });
    worksheet.addRow(row);
  });
  
  // Auto-fit columns
  columns.forEach((col, index) => {
    const column = worksheet.getColumn(index + 1);
    column.width = Math.max(col.header.length + 2, 15);
  });
  
  return await workbook.xlsx.writeBuffer();
};

// Export tickets
router.get('/tickets', authenticate, async (req, res) => {
  try {
    const format = req.query.format || 'csv';
    const ticketsCollection = database.getCollection('tickets');
    const baseQuery = { client_id: req.user.client_id };
    
    const tickets = await ticketsCollection.find(baseQuery).toArray();
    
    if (format === 'json') {
      res.json(tickets);
    } else if (format === 'csv') {
      // CSV export
      const csvHeader = 'ID,Title,Description,Status,Priority,Created By,Assigned To,Created At\n';
      const csvRows = tickets.map(ticket => 
        `"${ticket.id}","${ticket.title}","${ticket.description}","${ticket.status}","${ticket.priority}","${ticket.created_by_username || ''}","${ticket.assigned_to_username || ''}","${ticket.created_at}"`
      ).join('\n');
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="tickets.csv"');
      res.send(csvHeader + csvRows);
    } else if (format === 'excel') {
      // Excel export
      const columns = [
        { header: 'ID', key: 'id' },
        { header: 'Title', key: 'title' },
        { header: 'Description', key: 'description' },
        { header: 'Status', key: 'status' },
        { header: 'Priority', key: 'priority' },
        { header: 'Created By', key: 'created_by_username' },
        { header: 'Assigned To', key: 'assigned_to_username' },
        { header: 'Created At', key: 'created_at' }
      ];
      
      const buffer = await generateExcel(tickets, columns, 'Tickets');
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename="tickets.xlsx"');
      res.send(buffer);
    } else if (format === 'pdf') {
      // PDF export
      console.log('Starting PDF export for tickets...');
      
      // Escape HTML content to prevent issues
      const escapeHtml = (text) => {
        if (!text) return '';
        return text.toString()
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#39;');
      };
      
      const tableRows = tickets.map(ticket => `
        <tr>
          <td>${escapeHtml(ticket.id)}</td>
          <td>${escapeHtml(ticket.title)}</td>
          <td>${escapeHtml(ticket.description)}</td>
          <td><span class="status-badge" style="background: ${ticket.status === 'open' ? '#fef3c7' : ticket.status === 'closed' ? '#d1fae5' : '#e5e7eb'};">${escapeHtml(ticket.status)}</span></td>
          <td><span class="status-badge" style="background: ${ticket.priority === 'high' ? '#fecaca' : ticket.priority === 'medium' ? '#fed7aa' : '#d1fae5'};">${escapeHtml(ticket.priority)}</span></td>
          <td>${escapeHtml(ticket.created_by_username || '')}</td>
          <td>${escapeHtml(ticket.assigned_to_username || '')}</td>
          <td>${ticket.created_at ? new Date(ticket.created_at).toLocaleDateString() : ''}</td>
        </tr>
      `).join('');
      
      const htmlContent = `
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Title</th>
              <th>Description</th>
              <th>Status</th>
              <th>Priority</th>
              <th>Created By</th>
              <th>Assigned To</th>
              <th>Created At</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
        <p style="margin-top: 30px; color: #666; font-size: 12px;">Total Tickets: ${tickets.length}</p>
      `;
      
      const pdf = await generatePDF(htmlContent, 'Tickets Report');
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="tickets.pdf"');
      res.send(pdf);
    } else {
      res.status(400).json({ detail: 'Unsupported format. Use csv, excel, pdf, or json' });
    }
  } catch (error) {
    logger.error('Error exporting tickets', { error: error.message });
    res.status(500).json({ detail: 'Failed to export tickets' });
  }
});

// Export users (Admin only)
router.get('/users', authenticate, requireAdmin, async (req, res) => {
  try {
    const format = req.query.format || 'csv';
    const usersCollection = database.getCollection('users');
    const baseQuery = { 
      client_id: req.user.client_id,
      role: { $ne: 'superadmin' }
    };
    
    const users = await usersCollection.find(baseQuery, { 
      projection: { password_hash: 0 } 
    }).toArray();
    
    if (format === 'json') {
      res.json(users);
    } else if (format === 'csv') {
      const csvHeader = 'ID,Username,Email,Role,Created At\n';
      const csvRows = users.map(user => 
        `"${user.id}","${user.username}","${user.email}","${user.role}","${user.created_at}"`
      ).join('\n');
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="users.csv"');
      res.send(csvHeader + csvRows);
    } else if (format === 'excel') {
      // Excel export
      const columns = [
        { header: 'ID', key: 'id' },
        { header: 'Username', key: 'username' },
        { header: 'Email', key: 'email' },
        { header: 'Role', key: 'role' },
        { header: 'Created At', key: 'created_at' }
      ];
      
      const buffer = await generateExcel(users, columns, 'Users');
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename="users.xlsx"');
      res.send(buffer);
    } else if (format === 'pdf') {
      // PDF export
      console.log('Starting PDF export for users...');
      
      // Escape HTML content to prevent issues
      const escapeHtml = (text) => {
        if (!text) return '';
        return text.toString()
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#39;');
      };
      
      const tableRows = users.map(user => `
        <tr>
          <td>${escapeHtml(user.id)}</td>
          <td>${escapeHtml(user.username)}</td>
          <td>${escapeHtml(user.email)}</td>
          <td><span class="status-badge" style="background: ${user.role === 'admin' ? '#dbeafe' : '#f3f4f6'};">${escapeHtml(user.role)}</span></td>
          <td>${user.created_at ? new Date(user.created_at).toLocaleDateString() : ''}</td>
        </tr>
      `).join('');
      
      const htmlContent = `
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Username</th>
              <th>Email</th>
              <th>Role</th>
              <th>Created At</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
        <div style="margin-top: 30px; color: #666; font-size: 12px;">
          <p>Total Users: ${users.length}</p>
          <p>Admins: ${users.filter(u => u.role === 'admin').length}</p>
          <p>Regular Users: ${users.filter(u => u.role === 'user').length}</p>
        </div>
      `;
      
      const pdf = await generatePDF(htmlContent, 'Users Report');
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="users.pdf"');
      res.send(pdf);
    } else {
      res.status(400).json({ detail: 'Unsupported format. Use csv, excel, pdf, or json' });
    }
  } catch (error) {
    logger.error('Error exporting users', { error: error.message });
    res.status(500).json({ detail: 'Failed to export users' });
  }
});

// Export assets (Admin only)
router.get('/assets', authenticate, requireAdmin, async (req, res) => {
  try {
    const format = req.query.format || 'csv';
    const assetsCollection = database.getCollection('assets');
    const baseQuery = { client_id: req.user.client_id };
    
    const assets = await assetsCollection.find(baseQuery).toArray();
    
    if (format === 'json') {
      res.json(assets);
    } else if (format === 'csv') {
      const csvHeader = 'ID,Name,Description,Type,Value,Serial Number,Assigned To,Created At\n';
      const csvRows = assets.map(asset => 
        `"${asset.id}","${asset.name}","${asset.description}","${asset.asset_type}","${asset.value}","${asset.serial_number || ''}","${asset.assigned_to_username || ''}","${asset.created_at}"`
      ).join('\n');
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="assets.csv"');
      res.send(csvHeader + csvRows);
    } else if (format === 'excel') {
      // Excel export
      const columns = [
        { header: 'ID', key: 'id' },
        { header: 'Name', key: 'name' },
        { header: 'Description', key: 'description' },
        { header: 'Type', key: 'asset_type' },
        { header: 'Value', key: 'value' },
        { header: 'Serial Number', key: 'serial_number' },
        { header: 'Assigned To', key: 'assigned_to_username' },
        { header: 'Created At', key: 'created_at' }
      ];
      
      const buffer = await generateExcel(assets, columns, 'Assets');
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename="assets.xlsx"');
      res.send(buffer);
    } else if (format === 'pdf') {
      // PDF export
      const tableRows = assets.map(asset => `
        <tr>
          <td>${asset.id}</td>
          <td>${asset.name}</td>
          <td>${asset.description}</td>
          <td>${asset.asset_type}</td>
          <td>$${asset.value}</td>
          <td>${asset.serial_number || ''}</td>
          <td>${asset.assigned_to_username || 'Unassigned'}</td>
          <td>${new Date(asset.created_at).toLocaleDateString()}</td>
        </tr>
      `).join('');
      
      const totalValue = assets.reduce((sum, asset) => sum + (asset.value || 0), 0);
      
      const htmlContent = `
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Description</th>
              <th>Type</th>
              <th>Value</th>
              <th>Serial Number</th>
              <th>Assigned To</th>
              <th>Created At</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
        <div style="margin-top: 30px; color: #666; font-size: 12px;">
          <p>Total Assets: ${assets.length}</p>
          <p>Total Value: $${totalValue.toLocaleString()}</p>
        </div>
      `;
      
      const pdf = await generatePDF(htmlContent, 'Assets Report');
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="assets.pdf"');
      res.send(pdf);
    } else {
      res.status(400).json({ detail: 'Unsupported format. Use csv, excel, pdf, or json' });
    }
  } catch (error) {
    logger.error('Error exporting assets', { error: error.message });
    res.status(500).json({ detail: 'Failed to export assets' });
  }
});

// Export daily reports
router.get('/daily-reports', authenticate, async (req, res) => {
  try {
    const format = req.query.format || 'csv';
    const start = req.query.start;
    const end = req.query.end;
    
    const ticketsCollection = database.getCollection('tickets');
    const baseQuery = { client_id: req.user.client_id };
    
    // Add date filter if provided
    if (start || end) {
      baseQuery.created_at = {};
      if (start) baseQuery.created_at.$gte = new Date(start);
      if (end) baseQuery.created_at.$lte = new Date(end);
    }
    
    const tickets = await ticketsCollection.find(baseQuery).toArray();
    
    // Group by date
    const dailyData = {};
    tickets.forEach(ticket => {
      const date = ticket.created_at.toISOString().split('T')[0];
      if (!dailyData[date]) {
        dailyData[date] = { total: 0, open: 0, closed: 0, in_progress: 0 };
      }
      dailyData[date].total++;
      dailyData[date][ticket.status]++;
    });
    
    if (format === 'json') {
      res.json(dailyData);
    } else if (format === 'csv') {
      const csvHeader = 'Date,Total,Open,In Progress,Closed\n';
      const csvRows = Object.entries(dailyData).map(([date, data]) => 
        `"${date}","${data.total}","${data.open}","${data.in_progress}","${data.closed}"`
      ).join('\n');
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="daily-reports.csv"');
      res.send(csvHeader + csvRows);
    } else {
      res.status(400).json({ detail: 'Unsupported format. Use csv or json' });
    }
  } catch (error) {
    logger.error('Error exporting daily reports', { error: error.message });
    res.status(500).json({ detail: 'Failed to export daily reports' });
  }
});

module.exports = router;