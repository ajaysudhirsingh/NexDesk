const express = require('express');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const database = require('../config/database');
const logger = require('../utils/logger');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Setup TOTP during login (unauthenticated)
router.post('/setup-totp-login', async (req, res) => {
  try {
    const { username, password, client_code } = req.body;

    if (!username || !password || !client_code) {
      return res.status(400).json({ 
        error: 'Username, password, and client code are required' 
      });
    }

    const clientsCollection = database.getCollection('clients');
    const usersCollection = database.getCollection('users');

    // Find client by code
    const client = await clientsCollection.findOne({ code: client_code });
    if (!client) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Find user
    const user = await usersCollection.findOne({ 
      username: username, 
      client_id: client.id 
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password
    const { verifyPassword } = require('../utils/auth');
    if (!verifyPassword(password, user.password_hash)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Only allow superadmin users
    if (user.role !== 'superadmin') {
      return res.status(403).json({ 
        error: 'Only superadmin users can setup TOTP verification' 
      });
    }

    // Check if TOTP is already set up
    if (user.totp_secret && user.totp_enabled) {
      return res.status(400).json({ 
        error: 'TOTP is already enabled for this account' 
      });
    }

    // Generate TOTP secret
    const secret = speakeasy.generateSecret({
      name: `NEXDESK (${user.email})`,
      issuer: 'NEXDESK'
    });

    // Generate QR code
    const otpauthUrl = speakeasy.otpauthURL({
      secret: secret.base32,
      label: user.email,
      issuer: 'NEXDESK',
      encoding: 'base32'
    });

    const qrCodeDataURL = await QRCode.toDataURL(otpauthUrl);

    // Save secret to user (but don't enable yet)
    await usersCollection.updateOne(
      { id: user.id },
      {
        $set: {
          totp_secret: secret.base32,
          totp_enabled: false,
          updated_at: new Date()
        }
      }
    );

    logger.info('TOTP setup initiated for superadmin during login', { userId: user.id });

    res.json({
      message: 'TOTP setup initiated',
      qr_code: qrCodeDataURL,
      secret: secret.base32,
      manual_entry_key: secret.base32
    });

  } catch (error) {
    logger.error('Error setting up TOTP during login', { error: error.message });
    res.status(500).json({ 
      error: 'Internal server error' 
    });
  }
});

// Setup TOTP for superadmin user
router.post('/setup-totp', authenticate, async (req, res) => {
  try {
    const user = req.user;

    if (user.role !== 'superadmin') {
      return res.status(403).json({ 
        error: 'Only superadmin users can setup TOTP verification' 
      });
    }

    const usersCollection = database.getCollection('users');
    
    // Check if TOTP is already set up
    const existingUser = await usersCollection.findOne({ id: user.id });
    if (existingUser.totp_secret && existingUser.totp_enabled) {
      return res.status(400).json({ 
        error: 'TOTP is already enabled for this account' 
      });
    }

    // Generate TOTP secret
    const secret = speakeasy.generateSecret({
      name: `NEXDESK (${user.email})`,
      issuer: 'NEXDESK'
    });

    // Generate QR code
    const otpauthUrl = speakeasy.otpauthURL({
      secret: secret.base32,
      label: user.email,
      issuer: 'NEXDESK',
      encoding: 'base32'
    });

    const qrCodeDataURL = await QRCode.toDataURL(otpauthUrl);

    // Save secret to user (but don't enable yet)
    await usersCollection.updateOne(
      { id: user.id },
      {
        $set: {
          totp_secret: secret.base32,
          totp_enabled: false,
          updated_at: new Date()
        }
      }
    );

    logger.info('TOTP setup initiated for superadmin', { userId: user.id });

    res.json({
      message: 'TOTP setup initiated',
      qr_code: qrCodeDataURL,
      secret: secret.base32,
      manual_entry_key: secret.base32
    });

  } catch (error) {
    logger.error('Error setting up TOTP', { error: error.message });
    res.status(500).json({ 
      error: 'Internal server error' 
    });
  }
});

// Verify TOTP setup during login (unauthenticated)
router.post('/verify-totp-setup-login', async (req, res) => {
  try {
    const { username, password, client_code, totp_code } = req.body;

    if (!username || !password || !client_code || !totp_code) {
      return res.status(400).json({ 
        error: 'All fields are required' 
      });
    }

    const clientsCollection = database.getCollection('clients');
    const usersCollection = database.getCollection('users');

    // Find client by code
    const client = await clientsCollection.findOne({ code: client_code });
    if (!client) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Find user
    const user = await usersCollection.findOne({ 
      username: username, 
      client_id: client.id 
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password
    const { verifyPassword } = require('../utils/auth');
    if (!verifyPassword(password, user.password_hash)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Only allow superadmin users
    if (user.role !== 'superadmin') {
      return res.status(403).json({ 
        error: 'Only superadmin users can setup TOTP verification' 
      });
    }

    if (!user.totp_secret) {
      return res.status(400).json({ 
        error: 'TOTP setup not initiated. Please setup TOTP first.' 
      });
    }

    // Verify TOTP code
    const verified = speakeasy.totp.verify({
      secret: user.totp_secret,
      encoding: 'base32',
      token: totp_code,
      window: 2
    });

    if (!verified) {
      return res.status(401).json({ 
        error: 'Invalid TOTP code' 
      });
    }

    // Enable TOTP for the user
    await usersCollection.updateOne(
      { id: user.id },
      {
        $set: {
          totp_enabled: true,
          updated_at: new Date()
        }
      }
    );

    logger.info('TOTP enabled for superadmin during login', { userId: user.id });

    res.json({
      message: 'TOTP verification enabled successfully. Please login again.'
    });

  } catch (error) {
    logger.error('Error verifying TOTP setup during login', { error: error.message });
    res.status(500).json({ 
      error: 'Internal server error' 
    });
  }
});

// Verify and enable TOTP
router.post('/verify-totp-setup', authenticate, async (req, res) => {
  try {
    const { totp_code } = req.body;
    const user = req.user;

    if (!totp_code) {
      return res.status(400).json({ 
        error: 'TOTP code is required' 
      });
    }

    if (user.role !== 'superadmin') {
      return res.status(403).json({ 
        error: 'Only superadmin users can setup TOTP verification' 
      });
    }

    const usersCollection = database.getCollection('users');
    const existingUser = await usersCollection.findOne({ id: user.id });

    if (!existingUser.totp_secret) {
      return res.status(400).json({ 
        error: 'TOTP setup not initiated. Please setup TOTP first.' 
      });
    }

    // Verify TOTP code
    const verified = speakeasy.totp.verify({
      secret: existingUser.totp_secret,
      encoding: 'base32',
      token: totp_code,
      window: 2
    });

    if (!verified) {
      return res.status(401).json({ 
        error: 'Invalid TOTP code' 
      });
    }

    // Enable TOTP for the user
    await usersCollection.updateOne(
      { id: user.id },
      {
        $set: {
          totp_enabled: true,
          updated_at: new Date()
        }
      }
    );

    logger.info('TOTP enabled for superadmin', { userId: user.id });

    res.json({
      message: 'TOTP verification enabled successfully'
    });

  } catch (error) {
    logger.error('Error verifying TOTP setup', { error: error.message });
    res.status(500).json({ 
      error: 'Internal server error' 
    });
  }
});

// Disable TOTP
router.post('/disable-totp', authenticate, async (req, res) => {
  try {
    const { password, totp_code } = req.body;
    const user = req.user;

    if (!password || !totp_code) {
      return res.status(400).json({ 
        error: 'Password and TOTP code are required' 
      });
    }

    if (user.role !== 'superadmin') {
      return res.status(403).json({ 
        error: 'Only superadmin users can disable TOTP verification' 
      });
    }

    const usersCollection = database.getCollection('users');
    const existingUser = await usersCollection.findOne({ id: user.id });

    // Verify password
    const { verifyPassword } = require('../utils/auth');
    const passwordValid = verifyPassword(password, existingUser.password_hash);
    if (!passwordValid) {
      return res.status(401).json({ 
        error: 'Invalid password' 
      });
    }

    // Verify TOTP code
    const verified = speakeasy.totp.verify({
      secret: existingUser.totp_secret,
      encoding: 'base32',
      token: totp_code,
      window: 2
    });

    if (!verified) {
      return res.status(401).json({ 
        error: 'Invalid TOTP code' 
      });
    }

    // Disable TOTP
    await usersCollection.updateOne(
      { id: user.id },
      {
        $unset: {
          totp_secret: "",
          totp_enabled: ""
        },
        $set: {
          updated_at: new Date()
        }
      }
    );

    logger.info('TOTP disabled for superadmin', { userId: user.id });

    res.json({
      message: 'TOTP verification disabled successfully'
    });

  } catch (error) {
    logger.error('Error disabling TOTP', { error: error.message });
    res.status(500).json({ 
      error: 'Internal server error' 
    });
  }
});

// Check TOTP status
router.get('/totp-status', authenticate, async (req, res) => {
  try {
    const user = req.user;

    if (user.role !== 'superadmin') {
      return res.status(403).json({ 
        error: 'Only superadmin users can check TOTP status' 
      });
    }

    const usersCollection = database.getCollection('users');
    const existingUser = await usersCollection.findOne({ id: user.id });

    res.json({
      totp_enabled: !!existingUser.totp_enabled,
      totp_setup_required: user.role === 'superadmin' && !existingUser.totp_enabled
    });

  } catch (error) {
    logger.error('Error checking TOTP status', { error: error.message });
    res.status(500).json({ 
      error: 'Internal server error' 
    });
  }
});

// Reset TOTP and generate new QR code
router.post('/reset-totp-login', async (req, res) => {
  try {
    const { username, password, client_code } = req.body;

    if (!username || !password || !client_code) {
      return res.status(400).json({ 
        error: 'Username, password, and client code are required' 
      });
    }

    const clientsCollection = database.getCollection('clients');
    const usersCollection = database.getCollection('users');

    // Find client by code
    const client = await clientsCollection.findOne({ code: client_code });
    if (!client) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Find user
    const user = await usersCollection.findOne({ 
      username: username, 
      client_id: client.id 
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password
    const { verifyPassword } = require('../utils/auth');
    if (!verifyPassword(password, user.password_hash)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Only allow superadmin users
    if (user.role !== 'superadmin') {
      return res.status(403).json({ 
        error: 'Only superadmin users can reset TOTP verification' 
      });
    }

    // Generate new TOTP secret
    const secret = speakeasy.generateSecret({
      name: `NEXDESK (${user.email})`,
      issuer: 'NEXDESK'
    });

    // Generate QR code
    const otpauthUrl = speakeasy.otpauthURL({
      secret: secret.base32,
      label: user.email,
      issuer: 'NEXDESK',
      encoding: 'base32'
    });

    const qrCodeDataURL = await QRCode.toDataURL(otpauthUrl);

    // Reset TOTP data in database
    await usersCollection.updateOne(
      { id: user.id },
      {
        $set: {
          totp_secret: secret.base32,
          totp_enabled: false,
          totp_backup_codes: [],
          updated_at: new Date()
        },
        $unset: {
          twofa_secret: "",
          twofa_enabled: "",
          twofa_backup_codes: ""
        }
      }
    );

    logger.info('TOTP reset and new setup initiated for superadmin', { userId: user.id });

    res.json({
      message: 'TOTP reset successful. Please scan the new QR code.',
      qr_code: qrCodeDataURL,
      secret: secret.base32,
      manual_entry_key: secret.base32
    });

  } catch (error) {
    logger.error('Error resetting TOTP', { error: error.message });
    res.status(500).json({ 
      error: 'Internal server error' 
    });
  }
});

module.exports = router;